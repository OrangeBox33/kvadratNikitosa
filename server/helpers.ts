import {
	DEFAULT_COLOR,
	DEFAULT_X,
	DEFAULT_Y,
	BRIGHTNESS_DEVISION,
	HISTORY_SIZE,
} from './constants.js';
import { EArduinoActions } from './enums.js';
import {
	TArduinoClient,
	TArduinoClients,
	TGrid,
	TGridForArduino,
	THistory,
	TPixel,
} from './types.js';

export const createGrid = (): TGrid => {
	const grid: TGrid = [];
	for (let i = 0; i < DEFAULT_X * DEFAULT_Y; i++) {
		grid[i] = DEFAULT_COLOR;
	}

	return grid;
};

const hexToRgb = (hex: string) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
		: [0, 0, 0];
};

export const convertIdForArduino = (id: number) => {
	const posY = Math.floor(id / DEFAULT_X);

	// выбираю нечётные позиции по Y. Для них нужно инвертировать id
	if (posY % 2 === 0) {
		return posY * DEFAULT_X + DEFAULT_X - 1 - (id % DEFAULT_X);
	} else {
		return id;
	}
};

export const sleep = async (timeout: number): Promise<void> => {
	return new Promise((res) => {
		setTimeout(res, timeout);
	});
};

const makeGridForArduino = (grid: TGrid, action?: EArduinoActions) => {
	const gridForArduino: TGridForArduino = [];

	if (typeof action === 'number') {
		gridForArduino.push(action);
	}

	for (let id = 0; id < grid.length; id++) {
		const rgbArr256 = hexToRgb(grid[id]);
		const rgbArr32 = rgbArr256.map((value) => Math.floor(value / BRIGHTNESS_DEVISION));

		gridForArduino.push(convertIdForArduino(id), ...rgbArr32);
	}

	return gridForArduino;
};

export const makePixelsForArduino = (pixels: TPixel[], action?: EArduinoActions) => {
	const pixelsForArduino: TGridForArduino = [];

	if (typeof action === 'number') {
		pixelsForArduino.push(action);
	}

	for (const pixel of pixels) {
		const { id, color } = pixel;

		const rgbArr256 = hexToRgb(color);
		const rgbArr32 = rgbArr256.map((value) => Math.floor(value / BRIGHTNESS_DEVISION));

		pixelsForArduino.push(convertIdForArduino(id), ...rgbArr32);
	}

	return pixelsForArduino;
};

export const makeAndSendGridToOneArduino = (grid: TGrid, arduinoClient: TArduinoClient) => {
	const gridForArduino = makeGridForArduino(grid, EArduinoActions.GRID);

	arduinoClient.ws.send(new Uint8Array(gridForArduino));
};

export const makeAndSendGridToArduino = (grid: TGrid, arduinoClients: TArduinoClients) => {
	const gridForArduino = makeGridForArduino(grid, EArduinoActions.GRID);

	arduinoClients.forEach((arduinoClient) => {
		arduinoClient.ws.send(new Uint8Array(gridForArduino));
	});
};

export const makeAndSendPixelsToArduino = (pixels: TPixel[], arduinoClients: TArduinoClients) => {
	const pixelsForArduino = makePixelsForArduino(pixels, EArduinoActions.DRAW);

	arduinoClients.forEach((arduinoClient) => {
		arduinoClient.ws.send(new Uint8Array(pixelsForArduino));
	});
};

export const makeAndSendHistoryToArduino = (
	history: THistory,
	historyIndex: number,
	notFirstCycle: boolean,
	arduinoClients: TArduinoClients
) => {
	const historyForArduino: TGridForArduino = [];

	// Собираем историю изменений в один массив
	if (notFirstCycle) {
		for (let i = historyIndex; i < HISTORY_SIZE; i++) {
			historyForArduino.push(...makePixelsForArduino(history[i], EArduinoActions.HISTORY));
		}
	}

	for (let i = 0; i < historyIndex; i++) {
		historyForArduino.push(...makePixelsForArduino(history[i], EArduinoActions.HISTORY));
	}

	arduinoClients.forEach((arduinoClient) => {
		arduinoClient.ws.send(new Uint8Array(historyForArduino));
	});
};
