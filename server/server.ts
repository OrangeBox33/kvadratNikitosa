import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import {
	HISTORY_SIZE,
	CHAT_SIZE,
	CHAT_MESSAGE_SIZE,
	CHAT_USERNAME_SIZE,
	PLAY_HISTORY,
	RESET_HISTORY,
	TIMEOUT_BETWEEN_FRAMES,
	CHIP_TO_NAME,
	NAME_TO_CHIP,
} from './constants.js';
import {
	createGrid,
	makeAndSendGridToArduino,
	makeAndSendGridToOneArduino,
	makeAndSendHistoryToArduino,
	makeAndSendPixelsToArduino,
} from './helpers.js';
import { TArduinoClient, TChat, TDataFromClient, THistory, TPalette } from './types.js';
import { EMessageTypes } from './enums.js';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Логи ───────────────────────────────────────────────────────────────────
// Пишем с временем и тегом источника, чтобы в `pm2 logs` было видно,
// кто что сделал: [esp] — панель, [web] — браузер, [ota] — обновление прошивки.
const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 23);
const log = (tag: string, ...rest: unknown[]) => console.log(`[${ts()}] [${tag}]`, ...rest);

// Короткое имя панели для логов: имя, если чип известен, иначе сам чип/«?».
const panelLabel = (arduinoClient: TArduinoClient) =>
	arduinoClient.name ?? arduinoClient.chipId ?? '?';

// Кто сейчас на связи — печатаем при каждом коннекте/дисконнекте и перед OTA.
const panelsSummary = () =>
	arduinoClients.size === 0
		? 'нет подключённых панелей'
		: [...arduinoClients]
				.map((c) => `${panelLabel(c)}${c.isAlive ? '' : '(нет понга)'}`)
				.join(', ');

app.use(express.static(path.resolve(__dirname, '../public')));
app.use(express.json());
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);

// Отдаем index.html на роуте '/'
app.get('/', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// Отдаем wifi.html на роуте '/wifi/'
for (const espName in NAME_TO_CHIP) {
	app.get(`/wifi/${espName}`, (req, res) => {
		res.sendFile(path.resolve(__dirname, '../public/wifi.html'));
	});
}

// Отдаем update.html на роуте '/update/'
for (const espName in NAME_TO_CHIP) {
	app.get(`/update/${espName}`, (req, res) => {
		res.sendFile(path.resolve(__dirname, '../public/update.html'));
	});
}

// Отдаем calibrate.html на роуте '/calibrate' — страница подбора палитры.
// Без цикла по NAME_TO_CHIP: калибровка не привязана к конкретной панели.
app.get('/calibrate', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../public/calibrate.html'));
});

const server = http.createServer(app);
server.listen(3500);

let grid = createGrid();
let oldGrid = createGrid();
let history: THistory = [];
let historyIndex = 0;
let notFirstCycle = false;
let chat: TChat = [];
let playingHistory = false;

// Путь к сохранению — рядом с server.js, а не относительно cwd:
// под pm2 рабочая папка — корень dist, и относительный путь создал бы второй пустой save.json.
const savePath = path.resolve(__dirname, 'save.json');

const saveState = () => {
	fs.writeFileSync(
		savePath,
		JSON.stringify({
			grid,
			oldGrid,
			history,
			historyIndex,
			notFirstCycle,
			chat,
		}),
		'utf-8'
	);
};

if (fs.existsSync(savePath)) {
	const data = fs.readFileSync(savePath, 'utf-8');
	const parsedData = JSON.parse(data);
	grid = parsedData.grid;
	oldGrid = parsedData.oldGrid;
	history = parsedData.history;
	historyIndex = parsedData.historyIndex;
	notFirstCycle = parsedData.notFirstCycle;
	chat = parsedData.chat;
	log('state', `загружен ${savePath}`);
} else {
	log('state', `save.json не найден (${savePath}), создаём с начальным состоянием`);
	saveState();
}

// Палитра калибровки лежит отдельным файлом и тоже рядом с server.js — по той же
// причине, что и save.json: под pm2 cwd — корень dist, относительный путь создал бы второй файл.
const palettePath = path.resolve(__dirname, 'palette.json');

let palette: TPalette = {};

if (fs.existsSync(palettePath)) {
	try {
		palette = JSON.parse(fs.readFileSync(palettePath, 'utf-8'));
		log('palette', `загружен ${palettePath}, пар: ${Object.keys(palette).length}`);
	} catch (err) {
		// Битый файл не повод падать — работаем с пустой палитрой.
		log('palette', `не смог разобрать ${palettePath}, начинаю с пустой палитры:`, err);
		palette = {};
	}
}

// Пишем СРАЗУ при каждом сохранении цвета, а не раз в 60с как saveState:
// подбор цвета — ручная работа, терять её при рестарте нельзя.
// JSON с табами — чтобы пары можно было глазами перенести в src/utils/constants.ts.
const savePalette = () =>
	fs.writeFileSync(palettePath, JSON.stringify(palette, null, '\t'), 'utf-8');

const clients = new Set<WebSocket>();
const arduinoClients = new Set<TArduinoClient>();

const wssServer = new WebSocketServer({ server });
const wsServer = new WebSocketServer({ port: 81 });

wssServer.on('connection', onConnect);
wsServer.on('connection', onConnectArduino);

function onConnectArduino(ws: WebSocket, req: http.IncomingMessage) {
	const arduinoClient: TArduinoClient = { ws, isAlive: true };
	arduinoClients.add(arduinoClient);

	const connectedAt = Date.now();
	// Сколько секунд панель провисела на связи — если дисконнект «сразу же»,
	// в логе это будет видно как aliveFor≈0-2s.
	const aliveFor = () => `${((Date.now() - connectedAt) / 1000).toFixed(1)}s`;

	log(
		'esp',
		`подключилась панель с ${req.socket.remoteAddress}, всего панелей: ${arduinoClients.size}`
	);

	let heartbeatInterval: NodeJS.Timeout;

	makeAndSendGridToOneArduino(grid, arduinoClient);
	log('esp', 'отправили стартовую сетку (action=GRID)');

	arduinoClient.ws.on('message', function (message, isBinary) {
		const messageString = message.toString();

		if (messageString in CHIP_TO_NAME) {
			const espName = CHIP_TO_NAME[messageString as keyof typeof CHIP_TO_NAME];
			arduinoClient.chipId = messageString;
			arduinoClient.name = espName;
			log('esp', `чип ${messageString} опознан как "${espName}"`);

			return;
		}

		// Сюда попадаем, если чипа нет в CHIP_TO_NAME: панель останется без имени,
		// и адресные команды (wifi/ota) до неё не дойдут — молча. Поэтому громко пишем.
		log(
			'esp',
			`НЕИЗВЕСТНОЕ сообщение (binary=${isBinary}, ${messageString.length} симв.):`,
			JSON.stringify(messageString.slice(0, 120)),
			'— чипа нет в CHIP_TO_NAME, панель без имени, wifi/ota до неё НЕ дойдут'
		);
	});

	arduinoClient.ws.on('close', function (code, reason) {
		log(
			'esp',
			`панель "${panelLabel(arduinoClient)}" отключилась: code=${code}` +
				` reason="${reason.toString() || '-'}" провисела ${aliveFor()};` +
				` осталось панелей: ${arduinoClients.size - 1}`
		);

		clearInterval(heartbeatInterval);
		arduinoClients.delete(arduinoClient);
	});

	// Без этого обработчика ECONNRESET от панели прилетал бы как
	// unhandled 'error' и ронял весь процесс сервера.
	arduinoClient.ws.on('error', function (err) {
		log('esp', `ошибка сокета "${panelLabel(arduinoClient)}" (через ${aliveFor()}):`, err);
	});

	arduinoClient.ws.on('ping', function () {
		log('esp', `ping от "${panelLabel(arduinoClient)}" -> отвечаем pong`);

		if (arduinoClient.ws) {
			arduinoClient.ws.pong();
		}
	});

	arduinoClient.ws.on('pong', function () {
		log('esp', `pong от "${panelLabel(arduinoClient)}"`);

		if (arduinoClient.ws) {
			arduinoClient.isAlive = true;
		}
	});

	heartbeatInterval = setInterval(() => {
		if (arduinoClient.ws) {
			if (!arduinoClient.isAlive) {
				log(
					'esp',
					`панель "${panelLabel(arduinoClient)}" не ответила на ping за 30с — terminate`
				);
				clearInterval(heartbeatInterval);
				arduinoClient.ws.terminate();
				arduinoClients.delete(arduinoClient);

				return;
			}

			log('esp', `ping -> "${panelLabel(arduinoClient)}", ждём pong`);
			arduinoClient.isAlive = false;
			arduinoClient.ws.ping();
		}
	}, 30000);
}

function onConnect(ws: WebSocket) {
	clients.add(ws);
	log('web', `браузер подключился, всего браузеров: ${clients.size}`);

	ws.send(JSON.stringify({ type: 'getGrid', grid }));
	ws.send(JSON.stringify({ type: 'getChat', chat }));
	ws.send(JSON.stringify({ type: 'getPalette', palette }));

	ws.on('message', async function (message) {
		const {
			type,
			pixels,
			chatMessage,
			ssid,
			password,
			pathname,
			panel,
			screen,
		}: TDataFromClient = JSON.parse(message.toString());

		if (type === EMessageTypes.GET_GRID) {
			ws.send(JSON.stringify({ type: 'getGrid', grid }));

			return;
		}

		if (type === EMessageTypes.GET_CHAT) {
			ws.send(JSON.stringify({ type, chat }));

			return;
		}

		if (type === EMessageTypes.SAVE_COLOR) {
			const isHex = (color: unknown) =>
				typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color);

			if (!isHex(panel) || !isHex(screen)) {
				log('palette', 'некорректная пара цветов, не сохраняю:', panel, screen);

				return;
			}

			// Сервер везде хранит hex в верхнем регистре.
			const panelColor = panel.toUpperCase();
			const screenColor = screen.toUpperCase();

			palette[panelColor] = screenColor;
			savePalette();

			const total = Object.keys(palette).length;
			log('palette', `сохранено ${panelColor} -> ${screenColor}, всего пар: ${total}`);

			// Рассылаем всем браузерам, включая отправителя — ему нужно подтверждение.
			for (const client of clients) {
				client.send(JSON.stringify({ type: 'getPalette', palette }));
			}

			return;
		}

		if (type === EMessageTypes.WIFI) {
			if (ssid && password && pathname) {
				const espName = pathname.split('/')[2];
				log('wifi', `запрос смены сети для "${espName}" (на связи: ${panelsSummary()})`);

				if (espName in NAME_TO_CHIP) {
					let sent = 0;

					arduinoClients.forEach((arduinoClient) => {
						if (arduinoClient.name === espName) {
							arduinoClient.ws.send(JSON.stringify(`${ssid}:${password}`));
							sent++;
						}
					});

					log('wifi', sent ? `отправлено панелям: ${sent}` : `"${espName}" НЕ на связи`);
				} else {
					log('wifi', `имя "${espName}" отсутствует в NAME_TO_CHIP`);
				}
			} else {
				log('wifi', 'неполный запрос: нет ssid/password/pathname');
			}
		}

		if (type === EMessageTypes.OTA) {
			// Триггер OTA: шлём панели текстовую команду "OTA".
			// Саму прошивку панель качает сама по http (httpUpdate в скетче).
			log('ota', `запрос OTA, pathname="${pathname}" (на связи: ${panelsSummary()})`);

			if (pathname) {
				const espName = pathname.split('/')[2];

				if (espName in NAME_TO_CHIP) {
					let sent = 0;

					arduinoClients.forEach((arduinoClient) => {
						if (arduinoClient.name === espName) {
							arduinoClient.ws.send(JSON.stringify('OTA'));
							sent++;
							log('ota', `команда "OTA" отправлена панели "${espName}"`);
						}
					});

					if (!sent) {
						log(
							'ota',
							`панель "${espName}" не найдена — команда никуда не ушла.` +
								` Ждём чип ${NAME_TO_CHIP[espName as keyof typeof NAME_TO_CHIP]}`
						);
					}
				} else {
					log('ota', `имя "${espName}" отсутствует в NAME_TO_CHIP`);
				}
			} else {
				log('ota', 'в запросе нет pathname — некому отправлять');
			}

			return;
		}

		if (type === EMessageTypes.DRAW) {
			// Работа с историей
			if (notFirstCycle) {
				const historyPixels = history[historyIndex];

				for (const pixel of historyPixels) {
					const { id, color } = pixel;
					oldGrid[id] = color;
				}
			}

			history[historyIndex] = [...pixels];

			if (historyIndex === HISTORY_SIZE) {
				historyIndex = 1;
				notFirstCycle = true;
			} else {
				historyIndex++;
			}

			// запись в grid
			for (const pixel of pixels) {
				const { id, color } = pixel;
				grid[id] = color;
			}

			// отправка клиентам
			for (const client of clients) {
				if (client !== ws) {
					client.send(JSON.stringify({ type, pixels }));
				}
			}

			// отправка ардуино
			if (!playingHistory) {
				makeAndSendPixelsToArduino(pixels, arduinoClients);
			}

			return;
		}

		if (type === EMessageTypes.SEND_TO_CHAT) {
			const { username, text } = chatMessage;

			if (text) {
				if (username === PLAY_HISTORY && text === PLAY_HISTORY) {
					playingHistory = true;

					await makeAndSendHistoryToArduino(
						history,
						historyIndex,
						notFirstCycle,
						arduinoClients,
						oldGrid
					);

					setTimeout(() => {
						playingHistory = false;
						makeAndSendGridToArduino(grid, arduinoClients);
					}, TIMEOUT_BETWEEN_FRAMES * history.length + 1000);

					return;
				}

				if (username === RESET_HISTORY && text === RESET_HISTORY) {
					history = [];
					oldGrid = [...grid];
					historyIndex = 0;
					notFirstCycle = false;

					return;
				}

				if (chat.length > CHAT_SIZE) {
					chat.shift();
				}

				const slicedUsername = username.slice(0, CHAT_USERNAME_SIZE);
				const slicedText = text.slice(0, CHAT_MESSAGE_SIZE);

				chat.push({ username: slicedUsername, text: slicedText });

				for (const client of clients) {
					client.send(
						JSON.stringify({
							type,
							chatMessage: { username: slicedUsername, text: slicedText },
						})
					);
				}
			}

			return;
		}
	});

	ws.on('close', function (code) {
		log('web', `браузер отключился (code=${code}), осталось: ${clients.size - 1}`);
		if (clients.has(ws)) {
			clients.delete(ws);
		}
	});

	// Как и у панелей: без обработчика 'error' обрыв соединения уронил бы процесс.
	ws.on('error', function (err) {
		log('web', 'ошибка сокета браузера:', err);
	});
}

wssServer.on('error', (err) => log('web', 'ошибка WebSocketServer (браузеры, :3500):', err));
wsServer.on('error', (err) => log('esp', 'ошибка WebSocketServer (панели, :81):', err));

// Логируем причину падения и выходим — pm2 поднимет процесс заново.
process.on('uncaughtException', (err) => {
	log('fatal', 'uncaughtException:', err);
	process.exit(1);
});
process.on('unhandledRejection', (err) => log('fatal', 'unhandledRejection:', err));

log(
	'boot',
	`сервер запущен: браузеры на :3500, панели на :81,`,
	`статика из ${path.resolve(__dirname, '../public')}`
);

setInterval(saveState, 60000);
