import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
	plugins: [
		react({
			// styled-components: displayName и стабильные классы (как было в webpack)
			babel: {
				plugins: ['babel-plugin-styled-components'],
			},
		}),
		{
			// В dev отдаём нужный HTML на «чистых» путях /wifi и /update,
			// как это делает nginx/сервер в проде. Переписываем только
			// html-навигации, чтобы не задеть /src, /@vite, ассеты и HMR.
			name: 'clean-url-rewrites',
			configureServer(server) {
				server.middlewares.use((req, _res, next) => {
					if (req.headers.accept?.includes('text/html') && req.url) {
						if (req.url.startsWith('/wifi')) {
							req.url = '/wifi.html';
						} else if (req.url.startsWith('/update')) {
							req.url = '/update.html';
						}
					}
					next();
				});
			},
		},
	],
	server: {
		port: 3000,
		open: true,
	},
	build: {
		outDir: 'dist',
		rollupOptions: {
			input: {
				index: resolve(__dirname, 'index.html'),
				wifi: resolve(__dirname, 'wifi.html'),
				update: resolve(__dirname, 'update.html'),
			},
		},
	},
});
