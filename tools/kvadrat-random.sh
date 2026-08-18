#!/bin/bash
# Бот: раз в 10 минут просит claude придумать неожиданную картинку 16x16
# и молча отправляет её на панель через tools/kvadrat-send.mjs.
#
# Название картинки уходит в чат на сайте (kvadrat-say.mjs) — на панели видна
# только сама картинка, подпись к ней живёт там.
#
# В stdout не пишет НИЧЕГО — всё уходит в лог, поэтому скрипт одинаково
# годится и для `nohup`, и для cron. Ответ модели никому не показывается:
# из него берутся только сетка и название.
#
#   ./tools/kvadrat-random.sh          # цикл раз в 10 минут
#   ./tools/kvadrat-random.sh now      # обновить картинку здесь и сейчас,
#                                      # даже если бот уже крутится в фоне
#   ./tools/kvadrat-random.sh once     # один прогон под локом (для cron)
#   ./tools/kvadrat-random.sh --help
#
# Настройки через переменные окружения:
#   KVADRAT_INTERVAL  пауза между картинками, сек (по умолчанию 600)
#   KVADRAT_MODEL     модель для claude (по умолчанию haiku — задача мелкая)
#   KVADRAT_URL       адрес сервера (по умолчанию боевой)
#   KVADRAT_LOG       файл лога
#   KVADRAT_DRY       непусто — не отправлять, только писать превью в лог
#   KVADRAT_ARTIST    имя в чате, под которым объявляется название картинки
#   KVADRAT_NO_CHAT   непусто — не писать название в чат, только рисовать

set -u

ROOT=$(cd "$(dirname "$0")/.." && pwd)
SEND="$ROOT/tools/kvadrat-send.mjs"
SAY="$ROOT/tools/kvadrat-say.mjs"

# Имя, под которым бот объявляет в чат название нарисованного.
ARTIST=${KVADRAT_ARTIST:-художник}

INTERVAL=${KVADRAT_INTERVAL:-600}
MODEL=${KVADRAT_MODEL:-haiku}
TMP=${TMPDIR:-/tmp}
LOG=${KVADRAT_LOG:-$TMP/kvadrat-random.log}
THEMES=${KVADRAT_THEMES:-$TMP/kvadrat-random.themes}
LOCK=$TMP/kvadrat-random.lock
CLAUDE_TIMEOUT=${KVADRAT_CLAUDE_TIMEOUT:-180}

MODE=${1:-loop}

if [ "$MODE" = "--help" ] || [ "$MODE" = "-h" ]; then
	sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'
	exit 0
fi

log() {
	printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$LOG"
}

# В stdout не пишем никогда, но при запуске руками из терминала молчаливый
# выход выглядит как «ничего не произошло» — поэтому короткая строка в stderr,
# и только если stderr это tty (в cron/nohup она никуда не попадёт).
note() {
	if [ -t 2 ]; then
		printf '%s\n' "$*" >&2
	fi
}

# Лок каталогом: atomic и без flock, которого на macOS нет. Второй запуск
# (например наложившийся cron) уходит, а не рисует поверх первого.
#
# В каталоге держим pid владельца: если процесс умер жёстко (kill -9, закрытая
# консоль), trap не сработал, и без этой проверки битый лок навсегда блокировал
# бы все следующие запуски.
acquire_lock() {
	local owner

	if mkdir "$LOCK" 2>/dev/null; then
		printf '%s\n' "$$" >"$LOCK/pid"

		return 0
	fi

	owner=$(cat "$LOCK/pid" 2>/dev/null)

	if [ -n "$owner" ] && kill -0 "$owner" 2>/dev/null; then
		log "уже запущен (pid $owner) — выходим"
		note "Бот уже запущен (pid $owner). Останови его или дождись следующего тика."

		return 1
	fi

	log "битый лок от pid ${owner:-?} — забираем"
	rm -rf "$LOCK"

	if mkdir "$LOCK" 2>/dev/null; then
		printf '%s\n' "$$" >"$LOCK/pid"

		return 0
	fi

	log "не смог взять лок $LOCK"
	note "Не смог взять лок $LOCK"

	return 1
}

# Режим now — «обнови картинку сейчас» — лок НЕ берёт: он нужен, чтобы два
# фоновых бота не рисовали друг поверх друга, а ручной запуск должен работать
# и при живом боте. Худшее, что может случиться, — тик бота придёт сразу после
# ручного, и картинка сменится второй раз.
if [ "$MODE" != "now" ]; then
	if ! acquire_lock; then
		exit 0
	fi

	trap 'rm -rf "$LOCK" 2>/dev/null' EXIT INT TERM
fi

CLAUDE_BIN=$(command -v claude || true)

if [ -z "$CLAUDE_BIN" ]; then
	log "claude не найден в PATH — нечего запускать"
	exit 1
fi

# Разнообразие приходит ИЗ СКРИПТА, а не из модели. Проверено на 43 картинках:
# просьба «придумай что-нибудь неожиданное» даёт среднее представление модели о
# неожиданном, и оно всегда одно — предмет крупным планом (вантуз, штопор,
# домкрат). Плюс список прошлых тем работает ещё и как примеры жанра: пятнадцать
# бытовых предметов подряд — лучшая инструкция «дай шестнадцатый».
#
# Поэтому жанр композиции и палитру выбирает кубик, а модель придумывает сюжет
# уже внутри заданной рамки.
GENRE_KEYS=(object tiny landscape stick scene abstract pattern macro sign invert)
GENRE_TEXTS=(
	"один предмет крупным планом, во весь кадр, силуэт читается"
	"мелкая фигурка у края или в углу, вокруг много пустоты; сам объект занимает 3-6 клеток, не больше"
	"пейзаж с горизонтом: земля или вода снизу, небо сверху, в сцену вписано солнце, остров, гора, парус или дерево"
	"палочный человечек или контурный рисунок одной линией, без заливки; человечек может бежать, падать, махать рукой"
	"маленькая сценка из двух объектов, между которыми что-то происходит"
	"чистая абстракция без сюжета: полосы, спираль, концентрические кольца, шахматка, растекающееся пятно, шум"
	"узор-замощение: повторяющийся мотив от края до края, кадр обрезает его по краям"
	"макро-фактура: фрагмент поверхности крупным планом (срез арбуза, соты, шкура зебры, кладка, чешуя), кадр обрезает её со всех сторон"
	"знак крупно по центру: буква, цифра, стрелка, дорожный знак, символ"
	"инверсия: светлый фон на весь кадр, а объект тёмный силуэт на нём"
)

PALETTE_TEXTS=(
	"монохром: один светлый цвет по чёрному, всего два цвета"
	"два контрастных цвета плюс фон"
	"кислотный неон: маджента, циан, лайм"
	"тёплая закатная: красный, оранжевый, жёлтый"
	"холодная ледяная: синий, голубой, белый"
	"полный набор, до 6 цветов"
)

# Случайный индекс из /dev/urandom: $RANDOM в bash 3.2 сеется временем, и два
# тика, стартовавшие в одну секунду, дали бы одинаковый жанр.
rand_index() {
	local count=$1 value
	value=$(od -An -N4 -tu4 </dev/urandom | tr -d ' ')

	printf '%s\n' $((value % count))
}

# Жанр, не совпадающий с последними тремя: честный кубик спокойно выдаёт три
# пейзажа подряд, а это ровно та однообразность, от которой уходим.
# Результат — в GENRE_INDEX (возвращать через stdout нельзя, см. грабли с $()).
pick_genre() {
	local recent=$1 attempt index key

	index=$(rand_index ${#GENRE_KEYS[@]})

	for attempt in 1 2 3 4 5 6 7 8 9 10; do
		key=${GENRE_KEYS[$index]}

		case " $recent " in
			*" $key "*) ;;
			*)
				GENRE_INDEX=$index

				return 0
				;;
		esac

		index=$(rand_index ${#GENRE_KEYS[@]})
	done

	GENRE_INDEX=$index
}

# Промпт. Просим строгий формат: название + палитра + 16 строк по 16 символов.
# Сетку символами модель рисует надёжнее, чем 256 hex подряд (не сбивается
# со счёта), а kvadrat-send.mjs понимает оба формата.
#
# Чёрного списка тем («не сердечко, не смайл») здесь больше нет: он вычёркивал
# ровно живое и нефигуративное, оставляя модели одни бытовые предметы. Рамку
# теперь задаёт жанр, а тема внутри неё свободна.
build_prompt() {
	local seen=$1 seed=$2 genre=$3 palette=$4

	cat <<PROMPT
Придумай пиксель-арт 16x16 для физической LED-панели 16x16.

Жанр этого раза — $genre
Этот жанр обязателен, не подменяй его другим.

Палитра этого раза — $palette

Случайное зерно для сюжета: $seed
Уже было раньше, не повторяй: $seen

Рисунок НЕ обязан быть узнаваемым, симметричным и идеальным. Абстрактное,
кривое, наивное — нормально. Живая картинка в заданном жанре лучше, чем
аккуратная иконка не в том жанре.

Ограничения: не больше 6 цветов, цвета яркие и насыщенные (панель тусклая,
каждый канал делится на 4). Фон определяет жанр: если жанр не требует иного,
фон чёрный #000000.

Ответь СТРОГО в этом формате, без пояснений, без markdown-заборов:
TITLE: <название из 2-4 слов, по-русски>
PALETTE: .=#000000 A=#RRGGBB B=#RRGGBB
GRID:
<ровно 16 строк по ровно 16 символов из палитры>
PROMPT
}

ask_claude() {
	local prompt=$1 out status pid watchdog
	out=$(mktemp "$TMP/kvadrat-claude.XXXXXX")

	# Промпт подаём в stdin, а НЕ аргументом: --disallowed-tools объявлен
	# как variadic, и позиционный промпт после него был бы разобран как
	# продолжение списка инструментов ("Permission deny rule ... no known tool").
	#
	# Работаем из /tmp: в корне репозитория claude подхватил бы CLAUDE.md
	# проекта и тащил его в контекст на каждый тик — здесь он не нужен.
	# exec — чтобы $! был самим claude и watchdog убивал именно его.
	(
		cd "$TMP" || exit 1
		exec "$CLAUDE_BIN" -p \
			--model "$MODEL" \
			--output-format text \
			--no-session-persistence \
			--strict-mcp-config \
			--disallowed-tools "Bash Read Write Edit Glob Grep WebFetch WebSearch Task" \
			<"$prompt"
	) >"$out" 2>>"$LOG" &
	pid=$!

	# Свой watchdog вместо timeout(1): его на macOS по умолчанию нет.
	#
	# >/dev/null обязателен: без него watchdog наследует stdout вызывающего,
	# и если ask_claude вызвать через $(...), подстановка будет ждать закрытия
	# пайпа, то есть ВСЕГДА висеть все $CLAUDE_TIMEOUT секунд.
	(
		sleep "$CLAUDE_TIMEOUT"
		kill "$pid" 2>/dev/null
	) >/dev/null 2>&1 &
	watchdog=$!

	# disown — чтобы bash не печатал "Terminated: 15 ( sleep ... )", когда мы
	# убиваем watchdog после нормального ответа модели.
	disown "$watchdog" 2>/dev/null || true

	wait "$pid"
	status=$?

	# pkill по детям: kill самого подшелла не убивает его `sleep`, и тот
	# продолжал бы жить (и держать пайп) до конца таймаута.
	pkill -P "$watchdog" 2>/dev/null
	kill "$watchdog" 2>/dev/null

	if [ "$status" -ne 0 ]; then
		log "claude вернул код $status (таймаут ${CLAUDE_TIMEOUT}с?)"
		note "claude не ответил (код $status). Лог: $LOG"
		rm -f "$out"

		return 1
	fi

	# Путь к ответу отдаём через переменную, а не через stdout: командная
	# подстановка тут была источником зависания (см. комментарий выше).
	ANSWER_FILE=$out
}

tick() {
	local seed seen recent genre_key genre palette prompt answer status title announce reply

	# Зерно из /dev/urandom: без него модель раз за разом выбирает одно и то же.
	seed=$(od -An -N4 -tu4 </dev/urandom | tr -d ' ')

	# В файле тем строка это "жанр<TAB>название". Старые строки без табуляции
	# тоже читаются: cut без разделителя отдаёт строку целиком.
	seen=$(tail -n 15 "$THEMES" 2>/dev/null | cut -f2- | paste -sd '; ' -)
	recent=$(tail -n 3 "$THEMES" 2>/dev/null | cut -f1 | tr '\n' ' ')

	# Русский текст в ${var:-дефолт} ломает bash 3.2 из macOS
	# ("unbound variable" на многобайтном символе) — поэтому явные проверки.
	if [ -z "$seen" ]; then
		seen="пока ничего"
	fi

	pick_genre "$recent"
	genre_key=${GENRE_KEYS[$GENRE_INDEX]}
	genre=${GENRE_TEXTS[$GENRE_INDEX]}
	palette=${PALETTE_TEXTS[$(rand_index ${#PALETTE_TEXTS[@]})]}

	prompt=$(mktemp "$TMP/kvadrat-prompt.XXXXXX")
	build_prompt "$seen" "$seed" "$genre" "$palette" >"$prompt"

	note "Придумываю картинку (обычно 20-60с)..."
	log "тик: жанр $genre_key, спрашиваем claude (seed $seed)"

	ANSWER_FILE=
	ask_claude "$prompt"
	status=$?
	rm -f "$prompt"

	if [ "$status" -ne 0 ] || [ -z "$ANSWER_FILE" ]; then
		return 1
	fi

	answer=$ANSWER_FILE

	title=$(sed -n 's/^ *TITLE: *//p' "$answer" | head -n 1)
	# Пустое название в чат не объявляем: там ждут название картинки,
	# а не заглушку из лога.
	announce=$title

	if [ -z "$title" ]; then
		title="без названия"
	fi

	if [ -n "${KVADRAT_DRY:-}" ]; then
		reply=$("$SEND" "$answer" --dry-run ${KVADRAT_URL:+--url "$KVADRAT_URL"} 2>&1)
		log "DRY [${title}] (жанр $genre_key, seed $seed)"
		printf '%s\n' "$reply" >>"$LOG"
		note "DRY [${title}] — превью в логе: $LOG"
		rm -f "$answer"

		return 0
	fi

	if "$SEND" "$answer" --quiet ${KVADRAT_URL:+--url "$KVADRAT_URL"}; then
		log "отправлено: [${title}] (жанр $genre_key, seed $seed)"
		note "Отправлено: [${title}] (${genre_key})"
		printf '%s\t%s\n' "$genre_key" "$title" >>"$THEMES"

		# Название — в чат: на панели видна только картинка, а подпись к ней
		# живёт на сайте. Отдельным подключением, уже после того как картинка
		# доехала, чтобы подпись не опередила сам рисунок.
		if [ -z "${KVADRAT_NO_CHAT:-}" ] && [ -n "$announce" ]; then
			if "$SAY" --user "$ARTIST" --quiet ${KVADRAT_URL:+--url "$KVADRAT_URL"} "$announce"; then
				log "в чат: ${ARTIST}: ${announce}"
			else
				# Чат — украшение, картинка уже на панели: тик не валим.
				log "название в чат не ушло: ${announce}"
			fi
		fi
	else
		log "НЕ отправлено [${title}]: сетка не распознана или сервер недоступен. Ответ модели:"
		cat "$answer" >>"$LOG"
		note "НЕ отправлено [${title}]: сетка не распознана или сервер недоступен. Лог: $LOG"
	fi

	rm -f "$answer"
}

if [ "$MODE" = "once" ] || [ "$MODE" = "now" ]; then
	tick
	exit 0
fi

log "старт цикла: каждые ${INTERVAL}с, модель $MODEL"

while true; do
	tick
	sleep "$INTERVAL"
done
