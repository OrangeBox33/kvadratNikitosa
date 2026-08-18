#!/bin/bash
# Бот-посетитель: раз в 4 минуты подходит к панели, смотрит, что нарисовано,
# читает чат и бросает короткую реплику (2-4 слова) — как человек на фестивале,
# который прошёл мимо, отреагировал и пошёл дальше.
#
# Ничего не рисует: только читает состояние (tools/kvadrat-state.mjs) и пишет
# в чат (tools/kvadrat-say.mjs). Каждый тик — новый человек: своё имя и своя
# манера речи, которую бросает кубик (возглас, вопрос, предложение, смайлик...).
#
# Памяти между тиками у бота НЕТ: он видит только то, что сейчас на панели и
# в чате. Прошлые реплики в промпт не попадают сознательно — раньше попадали,
# и посетители сутками обсуждали картинку, которой давно нет.
#
# В stdout не пишет НИЧЕГО — всё уходит в лог, поэтому скрипт одинаково годится
# и для `nohup`, и для cron.
#
#   ./tools/kvadrat-visitor.sh          # цикл раз в 4 минуты
#   ./tools/kvadrat-visitor.sh now      # одна реплика здесь и сейчас,
#                                       # даже если бот уже крутится в фоне
#   ./tools/kvadrat-visitor.sh once     # один прогон под локом (для cron)
#   ./tools/kvadrat-visitor.sh --help
#
# Настройки через переменные окружения:
#   KVADRAT_VISITOR_INTERVAL  пауза между репликами, сек (по умолчанию 240)
#   KVADRAT_MODEL             модель для claude (по умолчанию haiku)
#   KVADRAT_URL               адрес сервера (по умолчанию боевой)
#   KVADRAT_VISITOR_LOG       файл лога
#   KVADRAT_VISITOR_STYLES    файл с последними манерами речи (только ключи)
#   KVADRAT_DRY               непусто — не отправлять, только писать в лог

set -u

ROOT=$(cd "$(dirname "$0")/.." && pwd)
SAY="$ROOT/tools/kvadrat-say.mjs"
STATE="$ROOT/tools/kvadrat-state.mjs"

INTERVAL=${KVADRAT_VISITOR_INTERVAL:-240}
MODEL=${KVADRAT_MODEL:-haiku}
TMP=${TMPDIR:-/tmp}
LOG=${KVADRAT_VISITOR_LOG:-$TMP/kvadrat-visitor.log}
STYLES=${KVADRAT_VISITOR_STYLES:-$TMP/kvadrat-visitor.styles}
LOCK=$TMP/kvadrat-visitor.lock
CLAUDE_TIMEOUT=${KVADRAT_CLAUDE_TIMEOUT:-180}

MODE=${1:-loop}

if [ "$MODE" = "--help" ] || [ "$MODE" = "-h" ]; then
	sed -n '2,29p' "$0" | sed 's/^# \{0,1\}//'
	exit 0
fi

log() {
	printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$LOG"
}

# В stdout не пишем никогда; из терминала — короткая строка в stderr,
# чтобы молчаливый выход не выглядел как «ничего не произошло».
note() {
	if [ -t 2 ]; then
		printf '%s\n' "$*" >&2
	fi
}

# Лок каталогом (см. kvadrat-random.sh): flock на macOS нет, а внутри держим
# pid — иначе жёстко убитый процесс заблокировал бы все следующие запуски.
acquire_lock() {
	local owner

	if mkdir "$LOCK" 2>/dev/null; then
		printf '%s\n' "$$" >"$LOCK/pid"

		return 0
	fi

	owner=$(cat "$LOCK/pid" 2>/dev/null)

	if [ -n "$owner" ] && kill -0 "$owner" 2>/dev/null; then
		log "уже запущен (pid $owner) — выходим"
		note "Бот-посетитель уже запущен (pid $owner)."

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

# Режим now лок не берёт: ручная реплика должна работать и при живом боте.
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

# Манеру речи бросает кубик — ровно по той же причине, по которой у художника
# кубиком выбирается жанр (см. kvadrat-random.sh): попросив модель «говорить
# разнообразно», получаешь её среднее представление о разнообразии, и все
# посетители выходят на одно лицо. Длина реплики теперь тоже часть манеры,
# а не общее правило: возглас — одно слово, а рассказчику нужно предложение.
STYLE_KEYS=(shout question guess sentence grumble emoji deadpan praise reply request offtop joke)
STYLE_TEXTS=(
	"короткий возглас на 1-2 слова, можно капсом и с восклицательным знаком (КРУТО!, ВАУ, огонь)"
	"короткий вопрос про то, что на панели, 2-5 слов"
	"догадка вслух, что это нарисовано, 2-5 слов"
	"одно обычное предложение спокойным разговорным тоном, 5-10 слов"
	"беззлобно поворчать: слепит, криво, цвет не тот. Без мата, 2-6 слов"
	"только смайлик или скобки, вообще без слов"
	"сухая констатация факта, без эмоций, 2-4 слова"
	"похвалить того, кто это рисовал, 2-5 слов"
	"ответить кому-то из чата, обратившись к нему по имени (если чат пуст — просто реплика про картинку)"
	"попросить нарисовать что-нибудь конкретное, 3-6 слов"
	"реплика мимо картинки: про фестиваль, очередь, кофе, духоту, 2-5 слов"
	"пошутить или скаламбурить по поводу картинки, до 8 слов"
)

# Манера вне кубика: применяется, только если последняя реплика в чате — вопрос.
ANSWER_STYLE="в чате только что задали вопрос — ответь именно на него, коротко и по делу, 1-6 слов, можно с юмором. Если вопрос про то, чего на панели уже нет, так и скажи"

# Насколько часто отвечаем на заданный вопрос (из 10). Не 10 из 10 сознательно:
# живой зал иногда пропускает вопрос мимо ушей, да и вопрос мог быть риторическим.
ANSWER_CHANCE=7

# Случайный индекс из /dev/urandom: $RANDOM в bash 3.2 сеется временем, и два
# тика, стартовавшие в одну секунду, дали бы одну манеру.
rand_index() {
	local count=$1 value
	value=$(od -An -N4 -tu4 </dev/urandom | tr -d ' ')

	printf '%s\n' $((value % count))
}

# Манера, не совпадающая с последними тремя: иначе честный кубик выдаёт три
# смайлика подряд. Результат — в STYLE_INDEX (через stdout нельзя, см. грабли
# с $() и фоновым watchdog'ом).
pick_style() {
	local recent=$1 attempt index key

	index=$(rand_index ${#STYLE_KEYS[@]})

	for attempt in 1 2 3 4 5 6 7 8 9 10; do
		key=${STYLE_KEYS[$index]}

		case " $recent " in
			*" $key "*) ;;
			*)
				STYLE_INDEX=$index

				return 0
				;;
		esac

		index=$(rand_index ${#STYLE_KEYS[@]})
	done

	STYLE_INDEX=$index
}

# Промпт. Картинка приходит символьной сеткой с палитрой — так модель её
# читает так же, как рисует сама (см. kvadrat-state.mjs --art).
#
# Прошлых реплик в промпте нет. Единственная память — это сам чат, который
# сервер отдаёт при подключении (последние 6 сообщений), и он же может отстать
# от картинки: поэтому отдельным абзацем сказано, что панель важнее чата.
build_prompt() {
	local state=$1 style=$2 seed=$3

	cat <<PROMPT
Идёт фестиваль. В зале висит LED-панель 16x16, на ней люди совместно рисуют
пиксель-арт, рядом общий чат. Ты — случайный посетитель: подошёл, глянул на
картинку, зацепил взглядом чат, бросил реплику и пошёл дальше.

Вот что сейчас на панели (палитра + 16 строк по 16 символов) и что в чате:

$state

Смотри на то, что на панели ПРЯМО СЕЙЧАС. Сообщения в чате могли остаться от
прошлой картинки: если они про то, чего на панели уже нет, не подхватывай эту
тему — реагируй на то, что видишь.

Твоя манера в этот раз — $style
Манера обязательна, не подменяй её другой и не удлиняй реплику.

Случайное зерно для твоего характера: $seed

Без приветствий, без представлений, без пояснений. Чужую реплику из чата
не повторяй.

Имя придумай себе короткое (до 16 символов): обычное имя, ник или прозвище.
Оно не должно совпадать с текстом реплики.

Ответь СТРОГО в этом формате, двумя строками, без markdown:
NAME: <имя>
TEXT: <реплика>
PROMPT
}

# Один в один как в kvadrat-random.sh: промпт через stdin (--disallowed-tools
# variadic и съел бы позиционный аргумент), работа из /tmp (иначе claude
# подхватит CLAUDE.md проекта), свой watchdog вместо отсутствующего на macOS
# timeout(1), ответ отдаётся файлом через ANSWER_FILE — командная подстановка
# вокруг фонового watchdog'а вешала процесс на весь таймаут.
ask_claude() {
	local prompt=$1 out status pid watchdog
	out=$(mktemp "$TMP/kvadrat-visitor-claude.XXXXXX")

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

	(
		sleep "$CLAUDE_TIMEOUT"
		kill "$pid" 2>/dev/null
	) >/dev/null 2>&1 &
	watchdog=$!

	disown "$watchdog" 2>/dev/null || true

	wait "$pid"
	status=$?

	pkill -P "$watchdog" 2>/dev/null
	kill "$watchdog" 2>/dev/null

	if [ "$status" -ne 0 ]; then
		log "claude вернул код $status (таймаут ${CLAUDE_TIMEOUT}с?)"
		note "claude не ответил (код $status). Лог: $LOG"
		rm -f "$out"

		return 1
	fi

	ANSWER_FILE=$out
}

tick() {
	local seed recent last style_key style state prompt answer status name text

	seed=$(od -An -N4 -tu4 </dev/urandom | tr -d ' ')
	recent=$(tail -n 3 "$STYLES" 2>/dev/null | tr '\n' ' ')

	note "Смотрю на панель и в чат..."

	state=$("$STATE" --art ${KVADRAT_URL:+--url "$KVADRAT_URL"} 2>>"$LOG")

	if [ -z "$state" ]; then
		log "не удалось прочитать состояние — пропускаем тик"
		note "Сервер не ответил. Лог: $LOG"

		return 1
	fi

	# Манеру выбираем ПОСЛЕ чтения чата: если последняя реплика — вопрос, чаще
	# всего на него надо ответить, иначе чат превращается в поток несвязанных
	# выкриков, где вопросы висят без ответа.
	last=$(printf '%s\n' "$state" | sed -n '/^CHAT:/,$p' | sed '1d' | tail -n 1)
	style_key=

	case "$last" in
		*\?)
			if [ "$(rand_index 10)" -lt "$ANSWER_CHANCE" ]; then
				style_key=answer
				style=$ANSWER_STYLE
			fi
			;;
	esac

	if [ -z "$style_key" ]; then
		pick_style "$recent"
		style_key=${STYLE_KEYS[$STYLE_INDEX]}
		style=${STYLE_TEXTS[$STYLE_INDEX]}
	fi

	prompt=$(mktemp "$TMP/kvadrat-visitor-prompt.XXXXXX")
	build_prompt "$state" "$style" "$seed" >"$prompt"

	note "Придумываю реплику (обычно 20-60с)..."
	log "тик: манера $style_key, спрашиваем claude (seed $seed)"

	ANSWER_FILE=
	ask_claude "$prompt"
	status=$?
	rm -f "$prompt"

	if [ "$status" -ne 0 ] || [ -z "$ANSWER_FILE" ]; then
		return 1
	fi

	answer=$ANSWER_FILE

	name=$(sed -n 's/^ *NAME: *//p' "$answer" | head -n 1 | tr -d '"«»')
	text=$(sed -n 's/^ *TEXT: *//p' "$answer" | head -n 1 | tr -d '"«»')

	if [ -z "$name" ] || [ -z "$text" ]; then
		log "модель ответила не по формату, реплики нет. Ответ:"
		cat "$answer" >>"$LOG"
		note "Ответ не по формату. Лог: $LOG"
		rm -f "$answer"

		return 1
	fi

	rm -f "$answer"

	# Имя, совпадающее с текстом, сервер принял бы за команду ('42' играет
	# историю на панелях, '228' её стирает) — kvadrat-say.mjs такое не пустит,
	# но лучше не доводить до ошибки.
	if [ "$name" = "$text" ]; then
		log "имя совпало с репликой (${name}) — пропускаем"

		return 1
	fi

	if [ -n "${KVADRAT_DRY:-}" ]; then
		log "DRY [${style_key}] ${name}: ${text}"
		note "DRY [${style_key}] ${name}: ${text}"

		return 0
	fi

	if "$SAY" --user "$name" --quiet ${KVADRAT_URL:+--url "$KVADRAT_URL"} "$text"; then
		log "сказал [${style_key}] ${name}: ${text}"
		note "${name}: ${text}"

		# В файл пишем ТОЛЬКО ключ манеры: сами реплики не хранятся нигде,
		# иначе они рано или поздно вернулись бы в промпт.
		printf '%s\n' "$style_key" >>"$STYLES"
	else
		log "реплика не ушла (${name}: ${text}): сервер недоступен?"
		note "Реплика не ушла. Лог: $LOG"

		return 1
	fi
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
