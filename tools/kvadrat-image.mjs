#!/usr/bin/env node
// Загоняет картинку на LED-панель: вырезает квадрат, ужимает до 16x16
// и отдаёт сетку в sendGrid (см. lib/kvadrat.mjs) — то есть подключается
// обычным клиентом и шлёт тот же `draw`, что и браузер.
//
// Запускается напрямую (`./tools/kvadrat-image.mjs pic.jpg`), без сборки TS
// и без npm-зависимостей: декодирует картинку системным `sips` (macOS)
// или `magick` (ImageMagick), а WebSocket берёт встроенный в Node 22.

import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
	DEFAULT_URL,
	EMPTY,
	GRID_X,
	GRID_Y,
	PIXELS,
	renderPreview,
	sendGrid,
} from './lib/kvadrat.mjs';

// Промежуточный размер перед усреднением. Кратен 16, поэтому один пиксель
// панели — это ровно блок 8x8, который мы усредняем сами: точнее, чем
// просить у sips сразу 16x16 (тот сэмплирует бикубикой и даёт алиасинг).
const PRESCALE = GRID_X * 8;

const USAGE = `
Использование:
  ./tools/kvadrat-image.mjs <файл|url> [опции]
  ./tools/kvadrat-image.mjs --clear

Опции:
  --fit cover|contain   cover (по умолчанию) — вырезать квадрат по центру;
                        contain — вписать целиком, добавив чёрные поля
  --offset X,Y          сдвиг квадрата кропа, -100..100 % свободного хода
                        (0,0 — центр; -100,0 — крайний левый край)
  --gamma N             1 = как есть, >1 светлее (полезно: панель делит яркость на 4)
  --contrast N          1 = как есть, >1 контрастнее
  --saturate N          1 = как есть, 0 — ч/б, >1 сочнее
  --animate MS          рисовать построчно с паузой MS мс вместо одного залпа
  --preview             только показать в терминале, ничего не отправлять
  --full                отправить все ${PIXELS} пикселей (по умолчанию — только изменившиеся)
  --clear               залить панель чёрным
  --url URL             куда подключаться (по умолчанию ${DEFAULT_URL})
  --no-preview          не печатать картинку в терминал

Готовую сетку 16x16 (без картинки) отправляет ./tools/kvadrat-send.mjs
`;

// ── Аргументы ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
	const opts = {
		source: null,
		fit: 'cover',
		offset: [0, 0],
		gamma: 1,
		contrast: 1,
		saturate: 1,
		animate: 0,
		preview: false,
		showPreview: true,
		full: false,
		clear: false,
		url: DEFAULT_URL,
	};

	const num = (raw, name) => {
		const value = Number(raw);

		if (!Number.isFinite(value)) {
			fail(`--${name} ожидает число, получено "${raw}"`);
		}

		return value;
	};

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];

		switch (arg) {
			case '-h':
			case '--help':
				console.log(USAGE.trim());
				process.exit(0);
			case '--fit':
				opts.fit = argv[++i];

				if (opts.fit !== 'cover' && opts.fit !== 'contain') {
					fail('--fit принимает только cover или contain');
				}

				break;
			case '--offset': {
				const parts = String(argv[++i]).split(',');

				if (parts.length !== 2) {
					fail('--offset ожидает "X,Y", например --offset -50,20');
				}

				opts.offset = [num(parts[0], 'offset'), num(parts[1], 'offset')];
				break;
			}
			case '--gamma':
				opts.gamma = num(argv[++i], 'gamma');
				break;
			case '--contrast':
				opts.contrast = num(argv[++i], 'contrast');
				break;
			case '--saturate':
				opts.saturate = num(argv[++i], 'saturate');
				break;
			case '--animate':
				opts.animate = num(argv[++i], 'animate');
				break;
			case '--preview':
			case '--dry-run':
				opts.preview = true;
				break;
			case '--no-preview':
				opts.showPreview = false;
				break;
			case '--full':
				opts.full = true;
				break;
			case '--clear':
				opts.clear = true;
				break;
			case '--url':
				opts.url = argv[++i];
				break;
			default:
				if (arg.startsWith('-')) {
					fail(`неизвестная опция "${arg}"\n${USAGE}`);
				}

				if (opts.source) {
					fail('можно указать только один источник картинки');
				}

				opts.source = arg;
		}
	}

	if (!opts.source && !opts.clear) {
		fail(`нужен путь к картинке или URL\n${USAGE}`);
	}

	if (opts.gamma <= 0) {
		fail('--gamma должна быть больше нуля');
	}

	return opts;
}

function fail(message) {
	console.error(`Ошибка: ${message}`);
	process.exit(1);
}

// ── Получение картинки ─────────────────────────────────────────────────────

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kvadrat-'));

process.on('exit', () => fs.rmSync(tmpDir, { recursive: true, force: true }));

async function resolveSource(source) {
	if (!/^https?:\/\//i.test(source)) {
		if (!fs.existsSync(source)) {
			fail(`файл не найден: ${source}`);
		}

		return source;
	}

	const response = await fetch(source);

	if (!response.ok) {
		fail(`не удалось скачать ${source}: HTTP ${response.status}`);
	}

	// Расширение берём из URL, а если его нет — из content-type: sips
	// определяет формат по содержимому, но без расширения иногда капризничает.
	const fromUrl = path.extname(new URL(source).pathname);
	const fromType = (response.headers.get('content-type') ?? '').includes('png') ? '.png' : '.jpg';
	const file = path.join(tmpDir, `download${fromUrl || fromType}`);

	fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));

	return file;
}

// ── Декодирование ──────────────────────────────────────────────────────────

function run(cmd, args) {
	const result = spawnSync(cmd, args, { encoding: 'utf8' });

	if (result.error || result.status !== 0) {
		const reason = result.error ? result.error.message : result.stderr.trim();

		fail(`${cmd} не справился: ${reason || `код ${result.status}`}`);
	}

	return result.stdout;
}

function has(cmd) {
	return spawnSync('command', ['-v', cmd], { shell: true, encoding: 'utf8' }).status === 0;
}

// Бэкенд декодирования: sips есть в каждой macOS, magick — путь для Linux
// (пригодится, если этот код когда-нибудь переедет на прод-сервер).
const backend = has('sips') ? 'sips' : has('magick') ? 'magick' : null;

if (!backend) {
	fail('не найдено ни sips (macOS), ни magick (ImageMagick) — чем декодировать картинку?');
}

function probeSize(file) {
	if (backend === 'sips') {
		const out = run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file]);
		const width = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1]);
		const height = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1]);

		if (!width || !height) {
			fail(`sips не смог прочитать размеры ${file} — это точно картинка?`);
		}

		return { width, height };
	}

	const out = run('magick', ['identify', '-format', '%w %h', file]);
	const [width, height] = out.trim().split(/\s+/).map(Number);

	return { width, height };
}

// Ресайз до заданных размеров + распаковка в плоский RGB.
function decode(file, width, height) {
	const bmp = path.join(tmpDir, 'frame.bmp');

	if (backend === 'sips') {
		// У sips порядок аргументов -z: сначала высота, потом ширина.
		run('sips', ['-z', String(height), String(width), file, '--out', bmp, '-s', 'format', 'bmp']);
	} else {
		run('magick', [file, '-resize', `${width}x${height}!`, `bmp3:${bmp}`]);
	}

	return readBmp(fs.readFileSync(bmp));
}

// Минимальный парсер несжатого BMP: sips пишет 24 бита top-down,
// но чужие BMP бывают 32-битными и bottom-up, поэтому учитываем оба случая.
function readBmp(buf) {
	if (buf.length < 54 || buf[0] !== 0x42 || buf[1] !== 0x4d) {
		fail('декодер вернул не BMP');
	}

	const offset = buf.readUInt32LE(10);
	const width = buf.readInt32LE(18);
	const rawHeight = buf.readInt32LE(22);
	const height = Math.abs(rawHeight);
	const bpp = buf.readUInt16LE(28);
	const compression = buf.readUInt32LE(30);
	const bottomUp = rawHeight > 0;

	if (bpp !== 24 && bpp !== 32) {
		fail(`ожидался BMP 24 или 32 бита, получен ${bpp}`);
	}

	if (compression !== 0 && !(compression === 3 && bpp === 32)) {
		fail(`сжатый BMP (compression=${compression}) не поддерживается`);
	}

	const bytesPerPixel = bpp / 8;
	const stride = Math.ceil((width * bytesPerPixel) / 4) * 4; // строки выровнены по 4 байта
	const rgb = new Uint8Array(width * height * 3);

	for (let y = 0; y < height; y++) {
		const srcRow = offset + (bottomUp ? height - 1 - y : y) * stride;

		for (let x = 0; x < width; x++) {
			const src = srcRow + x * bytesPerPixel;
			const dst = (y * width + x) * 3;

			rgb[dst] = buf[src + 2]; // BMP хранит каналы как BGR
			rgb[dst + 1] = buf[src + 1];
			rgb[dst + 2] = buf[src];
		}
	}

	return { width, height, rgb };
}

// ── Картинка -> сетка 16x16 ────────────────────────────────────────────────

// Усредняем в линейном свете: усреднение прямо в sRGB заметно гасит
// яркие детали (два пикселя 0 и 255 дают 128 вместо честных ~186).
const TO_LINEAR = new Float64Array(256);

for (let i = 0; i < 256; i++) {
	const c = i / 255;

	TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

const toSrgb = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

function buildGrid(image, opts) {
	const { width, height, rgb } = image;
	const [offX, offY] = opts.offset;

	// Свободный ход кропа: cover даёт полотно больше 128 хотя бы по одной
	// стороне, contain — меньше, и тогда картинка ложится в чёрный квадрат.
	const slackX = width - PRESCALE;
	const slackY = height - PRESCALE;
	const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
	const place = (slack, percent) =>
		slack >= 0
			? clamp(Math.round((slack / 2) * (1 + percent / 100)), 0, slack)
			: -clamp(Math.round((-slack / 2) * (1 - percent / 100)), 0, -slack);

	const startX = place(slackX, offX);
	const startY = place(slackY, offY);
	const block = PRESCALE / GRID_X;
	const grid = new Array(PIXELS);

	for (let row = 0; row < GRID_Y; row++) {
		for (let col = 0; col < GRID_X; col++) {
			let r = 0;
			let g = 0;
			let b = 0;
			let count = 0;

			for (let dy = 0; dy < block; dy++) {
				const y = startY + row * block + dy;

				if (y < 0 || y >= height) {
					continue;
				}

				for (let dx = 0; dx < block; dx++) {
					const x = startX + col * block + dx;

					if (x < 0 || x >= width) {
						continue;
					}

					const src = (y * width + x) * 3;

					r += TO_LINEAR[rgb[src]];
					g += TO_LINEAR[rgb[src + 1]];
					b += TO_LINEAR[rgb[src + 2]];
					count++;
				}
			}

			// count === 0 бывает только в contain-режиме: блок целиком за
			// пределами картинки, то есть поле — оставляем чёрным.
			const channels = count
				? [toSrgb(r / count), toSrgb(g / count), toSrgb(b / count)]
				: [0, 0, 0];

			grid[row * GRID_X + col] = toHex(adjust(channels, opts));
		}
	}

	return grid;
}

// Цветокоррекция в sRGB: панель делит каждый канал на 4, поэтому
// бледные картинки на ней выглядят совсем никак — гамму и сочность
// часто приходится подкручивать вручную.
function adjust([r, g, b], { gamma, contrast, saturate }) {
	let channels = [r, g, b];

	if (saturate !== 1) {
		const luma = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];

		channels = channels.map((c) => luma + (c - luma) * saturate);
	}

	if (contrast !== 1) {
		channels = channels.map((c) => (c - 0.5) * contrast + 0.5);
	}

	if (gamma !== 1) {
		channels = channels.map((c) => Math.pow(Math.max(0, c), 1 / gamma));
	}

	return channels;
}

function toHex(channels) {
	return `#${channels
		.map((c) =>
			Math.round(Math.min(1, Math.max(0, c)) * 255)
				.toString(16)
				.padStart(2, '0')
		)
		.join('')}`;
}

// ── Main ───────────────────────────────────────────────────────────────────

const opts = parseArgs(process.argv.slice(2));

let grid;

if (opts.clear) {
	grid = new Array(PIXELS).fill(EMPTY);
} else {
	const file = await resolveSource(opts.source);
	const { width, height } = probeSize(file);

	// cover: короткая сторона = 128, лишнее обрежем. contain: длинная = 128,
	// остальное станет чёрным полем.
	const scale =
		opts.fit === 'cover' ? PRESCALE / Math.min(width, height) : PRESCALE / Math.max(width, height);
	const targetW = Math.max(1, Math.round(width * scale));
	const targetH = Math.max(1, Math.round(height * scale));

	grid = buildGrid(decode(file, targetW, targetH), opts);
}

if (opts.showPreview) {
	console.log(renderPreview(grid));
}

if (opts.preview) {
	console.log('--preview: ничего не отправляем.');
} else {
	try {
		const { sent, frames } = await sendGrid(grid, opts);

		console.log(
			sent
				? `Отправлено: ${sent} пикс.${frames > 1 ? ` (${frames} кадров)` : ''} -> ${opts.url}`
				: 'На панели уже ровно эта картинка — отправлять нечего.'
		);
	} catch (err) {
		fail(err.message);
	}
}
