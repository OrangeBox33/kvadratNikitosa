import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import https from 'https';
import WebSocket, { WebSocketServer } from 'ws';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import {
	KEYS_OPTIONS,
	HISTORY_SIZE,
	CHAT_SIZE,
	CHAT_MESSAGE_SIZE,
	CHAT_USERNAME_SIZE,
	PLAY_HISTORY,
	RESET_HISTORY,
	TIMEOUT_BETWEEN_FRAMES,
} from './constants.js';
import {
	createGrid,
	makeAndSendGridToArduino,
	makeAndSendGridToOneArduino,
	makeAndSendHistoryToArduino,
	makeAndSendPixelsToArduino,
} from './helpers.js';
import { TArduinoClient, TChat, TDataFromClient, THistory } from './types.js';

const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.resolve(__dirname, './public')));

app.use(express.json());

app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);

const server = https.createServer(KEYS_OPTIONS, app);
const server2 = http.createServer(app);

server.listen(443);
server2.listen(80);

let grid = createGrid();
let oldGrid = createGrid();
let history: THistory = [];
let historyIndex = 0;
let notFirstCycle = false;
let chat: TChat = [];
let playingHistory = false;

const data = fs.readFileSync('./save.json', 'utf-8');
const parsedData = JSON.parse(data);
grid = parsedData.grid;
oldGrid = parsedData.oldGrid;
history = parsedData.history;
historyIndex = parsedData.historyIndex;
notFirstCycle = parsedData.notFirstCycle;
chat = parsedData.chat;

const clients = new Set<WebSocket>();
const arduinoClients = new Set<TArduinoClient>();

const wssServer = new WebSocketServer({ server });
const wsServer = new WebSocketServer({ port: 81 });

wssServer.on('connection', onConnect);
wsServer.on('connection', onConnectArduino);

function onConnectArduino(ws: WebSocket) {
	console.log('Arduino login');

	const arduinoClient = { ws, isAlive: true };
	arduinoClients.add(arduinoClient);

	makeAndSendGridToOneArduino(grid, arduinoClient);

	arduinoClient.ws.on('close', function () {
		console.log('Arduino closed');

		arduinoClients.delete(arduinoClient);
	});

	arduinoClient.ws.on('ping', function () {
		console.log('arduino ping');

		if (arduinoClient.ws) {
			arduinoClient.ws.pong();
		}
	});

	arduinoClient.ws.on('pong', function () {
		console.log('arduino pong');

		if (arduinoClient.ws) {
			arduinoClient.isAlive = true;
		}
	});

	setInterval(() => {
		if (arduinoClient.ws) {
			if (!arduinoClient.isAlive) {
				console.log('Arduino соединение прервано');
				arduinoClient.ws.terminate();
				arduinoClients.delete(arduinoClient);

				return;
			}

			arduinoClient.isAlive = false;
			arduinoClient.ws.ping();
		}
	}, 30000);
}

function onConnect(ws: WebSocket) {
	clients.add(ws);

	ws.send(JSON.stringify({ type: 'getGrid', grid }));
	ws.send(JSON.stringify({ type: 'getChat', chat }));

	ws.on('message', async function (message) {
		if (typeof message !== 'string') {
			return;
		}

		const { type, pixels, chatMessage }: TDataFromClient = JSON.parse(message);

		if (type === 'getGrid') {
			ws.send(JSON.stringify({ type: 'getGrid', grid }));

			return;
		}

		if (type === 'getChat') {
			ws.send(JSON.stringify({ type, chat }));

			return;
		}

		if (type === 'draw') {
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

		if (type === 'sendToChat') {
			const { username, text } = chatMessage;

			if (text) {
				if (username === PLAY_HISTORY && text === PLAY_HISTORY) {
					playingHistory = true;

					makeAndSendHistoryToArduino(
						history,
						historyIndex,
						notFirstCycle,
						arduinoClients
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

	ws.on('close', function () {
		console.log('отключился');
		if (clients.has(ws)) {
			clients.delete(ws);
		}
	});
}

console.log('Сервер запущен на 80 порту');

setInterval(() => {
	fs.writeFileSync(
		'save.json',
		JSON.stringify({ grid, oldGrid, history, historyIndex, notFirstCycle, chat }),
		'utf-8'
	);
}, 60000);
