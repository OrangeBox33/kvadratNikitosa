#!/usr/bin/env node
// Пишет сообщение в чат — тем же самым `sendToChat`, что шлёт браузер.
// Нужен ботам: художнику (объявить название картинки) и посетителю (реплика).
//
//   ./tools/kvadrat-say.mjs --user художник "Тюбик зубной пасты"
//   echo "Красиво!" | ./tools/kvadrat-say.mjs --user Гоша
//
// Ничего не печатает при --quiet: код выхода 0 — отправлено, 1 — не вышло.

import { DEFAULT_URL, sendChat } from './lib/kvadrat.mjs';

const USAGE = `
Использование:
  ./tools/kvadrat-say.mjs --user ИМЯ [текст]    # без текста читает stdin

Опции:
  --user ИМЯ      имя в чате (обязательно, режется до 16 символов)
  --quiet         ничего не печатать (для ботов и cron)
  --dry-run       только показать, не отправлять
  --url URL       куда подключаться (по умолчанию ${DEFAULT_URL})
`;

const opts = {
	user: '',
	text: null,
	quiet: false,
	dryRun: false,
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
		case '--user':
		case '--username':
			opts.user = argv[++i] ?? '';
			break;
		case '--quiet':
			opts.quiet = true;
			break;
		case '--dry-run':
			opts.dryRun = true;
			break;
		case '--url':
			opts.url = argv[++i];
			break;
		default:
			if (arg.startsWith('-') && arg !== '-') {
				fail(`неизвестная опция "${arg}"`);
			}

			// Текст может быть и несколькими аргументами — склеиваем.
			opts.text = opts.text === null ? arg : `${opts.text} ${arg}`;
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

if (!opts.user) {
	fail('не задано имя: --user ИМЯ');
}

const text = opts.text !== null && opts.text !== '-' ? opts.text : await readStdin();

if (opts.dryRun) {
	if (!opts.quiet) {
		console.log(`--dry-run: ${opts.user}: ${text.trim()}`);
	}

	process.exit(0);
}

try {
	const sent = await sendChat(opts.user, text, opts);

	if (!opts.quiet) {
		console.log(`В чат: ${sent.username}: ${sent.text}`);
	}
} catch (err) {
	fail(err.message);
}
