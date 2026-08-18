// Математика калибровки палитры: панель показывает цвет иначе, чем монитор,
// поэтому нужный RGB подбирается глазами. Здесь только генерация окрестности
// цвета и раскладка 16 плашек по 256 диодам — никакой сети и React.
import { DEFAULT_X, DEFAULT_Y } from './constants';
import { Color, Pixel } from './types';

export type Rgb = { r: number; g: number; b: number };
export type Channel = 'r' | 'g' | 'b';

// Панель различает всего 64 уровня на канал: сервер делит каждый канал на
// BRIGHTNESS_DEVISION = 4 нацело (server/helpers.ts). Поэтому все значения
// прищёлкиваем к кратным 4, иначе часть кандидатов на диодах будет
// буквально одинаковой, а hex в палитре — врать о том, что реально светит.
export const PANEL_STEP = 4;
// 252 и 255 дают один и тот же уровень диода (63), так что верхний
// предел — 252: он кратен 4 и ничего не теряет.
const MAX_CHANNEL = 252;

// 16 плашек по 4×4 пикселя ровно заполняют панель 16×16.
export const BLOCK = 4;
export const COLS = DEFAULT_X / BLOCK;
export const CANDIDATES = COLS * (DEFAULT_Y / BLOCK);

// Шаг кнопок R/G/B — кратен 4 по той же причине.
export const NUDGE_STEPS = [4, 8, 16];
export const SPREADS = [1, 2, 3];

// Смещения по осям окрестности. Нуль в списке есть намеренно: сама база
// всегда присутствует среди кандидатов, под номером BASE_INDEX.
const OFFSETS = [-1, 0, 1, 2];
const HUE_STEP = 6; // градусов на единицу разброса
const LIGHT_STEP = 0.035;
export const BASE_INDEX = OFFSETS.indexOf(0) * COLS + OFFSETS.indexOf(0);

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const snapChannel = (value: number) =>
	Math.min(MAX_CHANNEL, Math.max(0, Math.round(value / PANEL_STEP) * PANEL_STEP));

export const hexToRgb = (hex: string): Rgb => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

	if (!result) {
		return { r: 0, g: 0, b: 0 };
	}

	return {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16),
	};
};

export const rgbToHex = ({ r, g, b }: Rgb): Color =>
	`#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

// Прищёлкнутый к сетке панели цвет — то, что реально имеет смысл отправлять.
export const snapHex = (hex: string): Color => {
	const { r, g, b } = hexToRgb(hex);

	return rgbToHex({ r: snapChannel(r), g: snapChannel(g), b: snapChannel(b) });
};

export const nudgeHex = (hex: string, channel: Channel, delta: number): Color => {
	const rgb = hexToRgb(hex);

	return rgbToHex({ ...rgb, [channel]: snapChannel(rgb[channel] + delta) });
};

const rgbToHsl = ({ r, g, b }: Rgb) => {
	const red = r / 255;
	const green = g / 255;
	const blue = b / 255;

	const max = Math.max(red, green, blue);
	const min = Math.min(red, green, blue);
	const l = (max + min) / 2;
	const d = max - min;

	if (d === 0) {
		return { h: 0, s: 0, l };
	}

	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;

	if (max === red) {
		h = ((green - blue) / d + (green < blue ? 6 : 0)) / 6;
	} else if (max === green) {
		h = ((blue - red) / d + 2) / 6;
	} else {
		h = ((red - green) / d + 4) / 6;
	}

	return { h: h * 360, s, l };
};

const hslToRgb = ({ h, s, l }: { h: number; s: number; l: number }): Rgb => {
	if (s === 0) {
		return { r: l * 255, g: l * 255, b: l * 255 };
	}

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;

	const channel = (t: number) => {
		let value = t;

		if (value < 0) value += 1;
		if (value > 1) value -= 1;
		if (value < 1 / 6) return p + (q - p) * 6 * value;
		if (value < 1 / 2) return q;
		if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;

		return p;
	};

	const hue = (((h % 360) + 360) % 360) / 360;

	return {
		r: channel(hue + 1 / 3) * 255,
		g: channel(hue) * 255,
		b: channel(hue - 1 / 3) * 255,
	};
};

// 16 цветов вокруг базы: столбцы — оттенок, строки — светлота.
// Индекс кандидата = row * COLS + col, то есть слева-направо, сверху-вниз,
// как он и лежит на панели.
export const makeCandidates = (baseHex: string, spread: number): Color[] => {
	const hsl = rgbToHsl(hexToRgb(baseHex));
	const candidates: Color[] = [];

	for (const rowOffset of OFFSETS) {
		for (const colOffset of OFFSETS) {
			const { r, g, b } = hslToRgb({
				h: hsl.h + colOffset * HUE_STEP * spread,
				s: hsl.s,
				l: clamp01(hsl.l + rowOffset * LIGHT_STEP * spread),
			});

			candidates.push(
				rgbToHex({ r: snapChannel(r), g: snapChannel(g), b: snapChannel(b) })
			);
		}
	}

	return candidates;
};

// Раскладка кандидатов по диодам: плашка BLOCK×BLOCK пикселей на цвет.
export const candidatesToPixels = (candidates: Color[]): Pixel[] => {
	const pixels: Pixel[] = [];

	for (let id = 0; id < DEFAULT_X * DEFAULT_Y; id++) {
		const blockCol = Math.floor((id % DEFAULT_X) / BLOCK);
		const blockRow = Math.floor(Math.floor(id / DEFAULT_X) / BLOCK);

		pixels.push({ id, color: candidates[blockRow * COLS + blockCol] });
	}

	return pixels;
};

// Чтобы подписи на плашке читались и на светлом, и на тёмном цвете.
export const isLight = (hex: string) => {
	const { r, g, b } = hexToRgb(hex);

	return 0.299 * r + 0.587 * g + 0.114 * b > 140;
};
