#!/usr/bin/env node
// Показывает, что сейчас происходит: картинка на панели и последние сообщения
// чата. Сервер отдаёт и то и другое сам, сразу после подключения.
//
//   ./tools/kvadrat-state.mjs            # цветное превью + чат (для человека)
//   ./tools/kvadrat-state.mjs --art      # палитра + 16 строк символов (для модели)
//   ./tools/kvadrat-state.mjs --chat     # только чат
//
// --art печатает сетку ровно в том формате, в котором её просят у модели
// (палитра + 16 строк по 16 символов), поэтому вывод можно вклеить в промпт.

import { DEFAULT_URL, fetchState, gridToArt, renderPreview } from './lib/kvadrat.mjs';

const USAGE = `
Использование:
  ./tools/kvadrat-state.mjs [опции]

Опции:
  --art           сетка символами + палитра (машиночитаемо, для промпта)
  --chat          только чат
  --grid          только картинка
  --url URL       куда подключаться (по умолчанию ${DEFAULT_URL})
`;

const opts = {
	art: false,
	chat: false,
	grid: false,
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
		case '--art':
			opts.art = true;
			break;
		case '--chat':
			opts.chat = true;
			break;
		case '--grid':
			opts.grid = true;
			break;
		case '--url':
			opts.url = argv[++i];
			break;
		default:
			console.error(`Ошибка: неизвестная опция "${arg}"`);
			process.exit(1);
	}
}

// Без флагов показываем всё.
const showGrid = opts.grid || !opts.chat;
const showChat = opts.chat || !opts.grid;

try {
	const { grid, chat } = await fetchState(opts);

	if (showGrid) {
		if (!grid) {
			console.log('Сервер не прислал сетку.');
		} else if (opts.art) {
			const { rows, legend } = gridToArt(grid);

			console.log(`PALETTE: ${legend.join(' ')}`);
			console.log('GRID:');
			console.log(rows.join('\n'));
		} else {
			console.log(renderPreview(grid));
		}
	}

	if (showChat) {
		// В машинном режиме подписываем блок: тогда вывод целиком (палитра,
		// сетка, чат) вклеивается в промпт без разбора на части.
		if (opts.art && showGrid) {
			console.log('CHAT:');
		}

		console.log(
			chat.length
				? chat.map(({ username, text }) => `${username}: ${text}`).join('\n')
				: '(чат пуст)'
		);
	}
} catch (err) {
	console.error(`Ошибка: ${err.message}`);
	process.exit(1);
}
