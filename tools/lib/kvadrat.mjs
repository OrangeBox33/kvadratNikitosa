// Общая часть инструментов из tools/: константы протокола, отправка сетки
// на сервер, разбор текстовой сетки и превью в терминале.
//
// Отправка — это подключение обычным клиентом к тому же WebSocket, куда
// ходят браузеры, и то же самое сообщение `{ type: 'draw', pixels }`.
// Серверу правки не нужны: он сам обновит grid, историю, браузеры и панели.
//
// GRID_X/GRID_Y и строки типов сообщений продублированы из shared/ осознанно:
// инструменты запускаются без сборки TS, импортировать .ts нечем.

export const GRID_X = 16; // = DEFAULT_X в shared/constants.ts
export const GRID_Y = 16; // = DEFAULT_Y
export const PIXELS = GRID_X * GRID_Y;
export const EMPTY = '#000000'; // серверный DEFAULT_COLOR (клиент рисует пустоту как #303030)
export const DEFAULT_URL = 'wss://kvadratnikitosa.ru';

const DRAW = 'draw'; // = EMessageTypes.DRAW в shared/enums.ts
const GET_GRID = 'getGrid'; // = EMessageTypes.GET_GRID
const GET_CHAT = 'getChat'; // = EMessageTypes.GET_CHAT
const SEND_TO_CHAT = 'sendToChat'; // = EMessageTypes.SEND_TO_CHAT

// Серверные лимиты чата (server/constants.ts) — режем на своей стороне,
// чтобы отправить ровно то, что потом увидим в чате.
const CHAT_USERNAME_SIZE = 16;
const CHAT_MESSAGE_SIZE = 150;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Разбор текстовой сетки ─────────────────────────────────────────────────

// Понимает два формата (второй — на случай, когда сетку отдаёт модель):
//
//   1. 256 hex-цветов через любые разделители;
//   2. палитра `A=#RRGGBB` + 16 строк по 16 символов.
//
// Всё, что не похоже ни на палитру, ни на строку сетки, игнорируется —
// поэтому болтовня вокруг данных («вот твоя картинка:») не мешает.
export function parseGrid(text) {
	const palette = new Map([
		['.', EMPTY],
		[' ', EMPTY],
	]);

	for (const [, symbol, hex] of text.matchAll(/([^\s=])\s*=\s*#?([0-9a-f]{6})\b/gi)) {
		palette.set(symbol, `#${hex.toLowerCase()}`);
	}

	const lines = text.split('\n').map((line) => line.trim());
	const rows = pickRows(lines, (line) => [...line].every((ch) => palette.has(ch)));

	// Мягкий проход: модель объявила не все символы. Неизвестные считаем фоном —
	// лучше отдать картинку с дырой, чем уронить весь тик бота.
	const fallbackRows = rows ?? pickRows(lines, (line) => /^[!-~]{16}$/.test(line));

	if (fallbackRows) {
		return fallbackRows.flatMap((line) => [...line].map((ch) => palette.get(ch) ?? EMPTY));
	}

	// Формат 1: просто цвета. Палитра тоже даёт hex, поэтому требуем ровно
	// PIXELS штук — палитры из 6 цветов сюда не дотянут.
	const colors = [...text.matchAll(/#?\b([0-9a-f]{6})\b/gi)].map(([, hex]) => `#${hex.toLowerCase()}`);

	if (colors.length >= PIXELS) {
		return colors.slice(0, PIXELS);
	}

	throw new Error(
		`не нашёл сетку: нужно ${PIXELS} цветов или ${GRID_Y} строк по ${GRID_X} символов` +
			` (нашёл ${colors.length} цветов)`
	);
}

// Первые GRID_Y подряд идущих строк ровно нужной ширины.
function pickRows(lines, isRow) {
	const found = lines.filter((line) => line.length === GRID_X && isRow(line));

	return found.length >= GRID_Y ? found.slice(0, GRID_Y) : null;
}

// ── Превью в терминале ─────────────────────────────────────────────────────

// Два ряда сетки в одной строке: верхний — цвет символа, нижний — фон.
// Каждый пиксель шириной в два знака, иначе картинка выходит сплющенной.
export function renderPreview(grid) {
	const rgbOf = (hex) => [
		parseInt(hex.slice(1, 3), 16),
		parseInt(hex.slice(3, 5), 16),
		parseInt(hex.slice(5, 7), 16),
	];
	const out = [''];

	for (let row = 0; row < GRID_Y; row += 2) {
		let line = '  ';

		for (let col = 0; col < GRID_X; col++) {
			const [tr, tg, tb] = rgbOf(grid[row * GRID_X + col]);
			const [br, bg, bb] = rgbOf(grid[(row + 1) * GRID_X + col]);

			line += `\x1b[38;2;${tr};${tg};${tb}m\x1b[48;2;${br};${bg};${bb}m▀▀`;
		}

		out.push(`${line}\x1b[0m`);
	}

	out.push('');

	return out.join('\n');
}

// ── Сетка обратно в текст ──────────────────────────────────────────────────

// Обратная операция к parseGrid: 256 цветов -> палитра + 16 строк по 16
// символов. Нужна, чтобы показать текущую картинку языковой модели — цветной
// ANSI-превью она не увидит, а символьную сетку читает так же, как рисует.
//
// Цветов на панели может оказаться сколько угодно (фотографии), а символов
// у нас 32, поэтому сначала квантуем каналы до 4 уровней, а потом лишние
// цвета схлопываем к ближайшему из самых частых.
export function gridToArt(grid, { symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' } = {}) {
	const quantize = (hex) =>
		'#' +
		[1, 3, 5]
			.map((at) => Math.round(parseInt(hex.slice(at, at + 2), 16) / 85) * 85)
			.map((value) => value.toString(16).padStart(2, '0'))
			.join('');

	const rgbOf = (hex) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
	const quantized = grid.map((color) => quantize(color.toLowerCase()));
	const counts = new Map();

	for (const color of quantized) {
		counts.set(color, (counts.get(color) ?? 0) + 1);
	}

	// Чёрный — всегда фон и всегда точка, остальные по убыванию площади.
	const ranked = [...counts.entries()]
		.filter(([color]) => color !== EMPTY)
		.sort((a, b) => b[1] - a[1])
		.map(([color]) => color)
		.slice(0, symbols.length);

	const palette = new Map([[EMPTY, '.']]);

	ranked.forEach((color, index) => palette.set(color, symbols[index]));

	const nearest = (hex) => {
		const [r, g, b] = rgbOf(hex);
		let best = EMPTY;
		let bestDistance = Infinity;

		for (const color of [EMPTY, ...ranked]) {
			const [cr, cg, cb] = rgbOf(color);
			const distance = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;

			if (distance < bestDistance) {
				bestDistance = distance;
				best = color;
			}
		}

		return palette.get(best);
	};

	const rows = [];

	for (let row = 0; row < GRID_Y; row++) {
		let line = '';

		for (let col = 0; col < GRID_X; col++) {
			const color = quantized[row * GRID_X + col];

			line += palette.get(color) ?? nearest(color);
		}

		rows.push(line);
	}

	const legend = ['.=#000000', ...ranked.map((color) => `${palette.get(color)}=${color}`)];

	return { rows, legend, palette };
}

// ── Отправка ───────────────────────────────────────────────────────────────

function connect(url) {
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(url);
		// Сервер сам присылает getGrid и getChat первыми сообщениями после
		// коннекта — ловим оба: сетку, чтобы слать только меняющиеся пиксели,
		// чат, чтобы бот-посетитель знал, о чём тут говорят.
		let onGrid = null;
		let onChat = null;
		const gridPromise = new Promise((res) => {
			onGrid = res;
		});
		const chatPromise = new Promise((res) => {
			onChat = res;
		});
		const timer = setTimeout(() => {
			ws.close();
			reject(new Error(`таймаут подключения к ${url}`));
		}, 10000);

		ws.onopen = () => {
			clearTimeout(timer);
			resolve({ ws, gridPromise, chatPromise });
		};

		ws.onerror = () => {
			clearTimeout(timer);
			reject(new Error(`не удалось подключиться к ${url}`));
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(String(event.data));

				if (data.type === GET_GRID && Array.isArray(data.grid)) {
					onGrid(data.grid);
				}

				if (data.type === GET_CHAT && Array.isArray(data.chat)) {
					onChat(data.chat);
				}
			} catch {
				// прочий трафик нас не интересует
			}
		};
	});
}

// Возвращает { sent, frames }: сколько пикселей ушло и сколькими кадрами.
export async function sendGrid(grid, { url = DEFAULT_URL, full = false, animate = 0 } = {}) {
	const { ws, gridPromise } = await connect(url);

	let pixels = grid.map((color, id) => ({ id, color }));

	if (!full) {
		// Ждём стартовый getGrid недолго: он приходит первым же сообщением,
		// а если сервер промолчал — просто отправим все PIXELS.
		const current = await Promise.race([gridPromise, sleep(3000)]);

		if (Array.isArray(current)) {
			pixels = pixels.filter(
				({ id, color }) => (current[id] ?? EMPTY).toLowerCase() !== color.toLowerCase()
			);
		}
	}

	if (!pixels.length) {
		ws.close();

		return { sent: 0, frames: 0 };
	}

	// Один draw = один кадр в серверной history. Батчем — мгновенная смена
	// картинки и одна запись в историю; animate режет на строки.
	const chunks = animate
		? Array.from({ length: GRID_Y }, (_, row) =>
				pixels.filter(({ id }) => Math.floor(id / GRID_X) === row)
			).filter((chunk) => chunk.length)
		: [pixels];

	for (let i = 0; i < chunks.length; i++) {
		ws.send(JSON.stringify({ type: DRAW, pixels: chunks[i] }));

		if (animate && i < chunks.length - 1) {
			await sleep(animate);
		}
	}

	// Не закрываем сокет, пока буфер не ушёл в сеть, иначе последний кадр
	// может не долететь.
	for (let i = 0; i < 100 && ws.bufferedAmount > 0; i++) {
		await sleep(50);
	}

	await sleep(150);
	ws.close();

	return { sent: pixels.length, frames: chunks.length };
}

// Что сейчас на панели и что в чате. Сервер шлёт и то и другое сразу после
// коннекта, так что это просто «подключиться и послушать».
export async function fetchState({ url = DEFAULT_URL, timeout = 5000 } = {}) {
	const { ws, gridPromise, chatPromise } = await connect(url);
	const grid = await Promise.race([gridPromise, sleep(timeout)]);
	// Чат приходит следом за сеткой — второй раз столько ждать незачем.
	const chat = await Promise.race([chatPromise, sleep(1000)]);

	ws.close();

	return {
		grid: Array.isArray(grid) ? grid : null,
		chat: Array.isArray(chat) ? chat : [],
	};
}

// Сообщение в чат — то же самое, что шлёт браузер из поля ввода.
// Сервер сам разошлёт его всем остальным и положит в свою историю чата.
export async function sendChat(username, text, { url = DEFAULT_URL } = {}) {
	const name = String(username ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, CHAT_USERNAME_SIZE);
	const message = String(text ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, CHAT_MESSAGE_SIZE);

	if (!name || !message) {
		throw new Error('пустое имя или пустой текст');
	}

	// username === text — это командный канал сервера: '42' проигрывает историю
	// на панелях, '228' её стирает. В чат такое сообщение не попадает вовсе,
	// так что боту туда лезть нечего.
	if (name === message) {
		throw new Error(`username совпадает с текстом ("${name}") — сервер примет это за команду`);
	}

	const { ws } = await connect(url);

	ws.send(JSON.stringify({ type: SEND_TO_CHAT, chatMessage: { username: name, text: message } }));

	// Как и при отправке пикселей: закрывать сокет, пока буфер не ушёл, нельзя.
	for (let i = 0; i < 100 && ws.bufferedAmount > 0; i++) {
		await sleep(50);
	}

	await sleep(150);
	ws.close();

	return { username: name, text: message };
}
