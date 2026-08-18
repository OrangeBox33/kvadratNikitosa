#!/usr/bin/env node
// Отправляет на панель ГОТОВУЮ сетку 16x16 — без всякой работы с картинками.
// Сетка читается из файла или со stdin, поэтому её может нарисовать что угодно:
// другой скрипт, руками написанный текстовый файл или языковая модель.
//
// Два понимаемых формата (см. parseGrid в lib/kvadrat.mjs):
//   1. 256 hex-цветов через любые разделители;
//   2. палитра `A=#RRGGBB` + 16 строк по 16 символов.
//
// Ничего не печатает при --quiet: код выхода 0 — отправлено, 1 — не вышло.

import fs from 'fs';
import {
	DEFAULT_URL,
	EMPTY,
	PIXELS,
	parseGrid,
	renderPreview,
	sendGrid,
} from './lib/kvadrat.mjs';

const USAGE = `
Использование:
  ./tools/kvadrat-send.mjs [файл] [опции]     # без файла читает stdin
  ./tools/kvadrat-send.mjs --clear

Опции:
  --quiet         ничего не печатать (для ботов и cron)
  --dry-run       только показать, не отправлять
  --animate MS    рисовать построчно с паузой MS мс
  --full          отправить все ${PIXELS} пикселей, а не только изменившиеся
  --clear         залить чёрным
  --url URL       куда подключаться (по умолчанию ${DEFAULT_URL})

Форматы сетки:
  256 hex-цветов через пробел/запятую/перевод строки
  или палитра "A=#ff0000 B=#00ff00" + 16 строк по 16 символов
`;

const opts = {
	source: null,
	quiet: false,
	dryRun: false,
	animate: 0,
	full: false,
	clear: false,
	url: DEFAULT_URL,
};

const argv = process.argv.slice(2);

for (let i = 0; i < argv.length; i++) {
	const arg = argv[i];

	switch (arg) {
		case '-h':
		case '--help':
			console.log(USAGE.trim());
			process.exit(0);
		case '--quiet':
			opts.quiet = true;
			break;
		case '--dry-run':
		case '--preview':
			opts.dryRun = true;
			break;
		case '--animate':
			opts.animate = Number(argv[++i]);
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
			if (arg.startsWith('-') && arg !== '-') {
				fail(`неизвестная опция "${arg}"`);
			}

			opts.source = arg;
	}
}

function fail(message) {
	if (!opts.quiet) {
		console.error(`Ошибка: ${message}`);
	}

	process.exit(1);
}

const readStdin = async () => {
	const chunks = [];

	for await (const chunk of process.stdin) {
		chunks.push(chunk);
	}

	return Buffer.concat(chunks).toString('utf8');
};

let grid;

if (opts.clear) {
	grid = new Array(PIXELS).fill(EMPTY);
} else {
	const raw =
		opts.source && opts.source !== '-'
			? fs.existsSync(opts.source)
				? fs.readFileSync(opts.source, 'utf8')
				: fail(`файл не найден: ${opts.source}`)
			: await readStdin();

	try {
		grid = parseGrid(raw);
	} catch (err) {
		fail(err.message);
	}
}

if (!opts.quiet) {
	console.log(renderPreview(grid));
}

if (opts.dryRun) {
	if (!opts.quiet) {
		console.log('--dry-run: ничего не отправляем.');
	}

	process.exit(0);
}

try {
	const { sent, frames } = await sendGrid(grid, opts);

	if (!opts.quiet) {
		console.log(
			sent
				? `Отправлено: ${sent} пикс.${frames > 1 ? ` (${frames} кадров)` : ''} -> ${opts.url}`
				: 'На панели уже ровно эта картинка — отправлять нечего.'
		);
	}
} catch (err) {
	fail(err.message);
}
