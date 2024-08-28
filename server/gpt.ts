import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import https from 'https';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { KEYS_OPTIONS } from './constants.js';

const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.resolve(__dirname, './public')));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.sendFile(path.resolve(__dirname, './public/index.html'));
});

app.get('/wifi', (req, res) => {
	res.sendFile(path.resolve(__dirname, './public/wifi.html'));
});

const server = https.createServer(KEYS_OPTIONS, app);
const server2 = http.createServer(app);

server.listen(443);
server2.listen(80);
