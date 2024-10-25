// const storage = multer.diskStorage({
// 	destination: function (req, file, cb) {
// 		cb(null, path.resolve(__dirname, './uploads'));
// 	},
// 	filename: function (req, file, cb) {
// 		cb(null, file.originalname);
// 	},
// });

// const upload = multer({ storage: storage });

// app.get('/update', (req, res) => {
// 	res.sendFile(path.resolve(__dirname, './public/update.html'));
// });

// app.post('/upload', upload.single('file'), (req, res) => {
// 	if (!req.file) {
// 		return res.status(400).send('No file uploaded.');
// 	}
// 	res.send('File uploaded successfully.');

// 	arduinoClients.forEach((arduinoClient) => {
// 		sendFirmware(arduinoClient, 'kvadrat.ino.bin', main);
// 	});
// });

// export const sendFirmware = (arduinoClient: TArduinoClient, fileName: string, main: TMain) => {
// 	main.isUpdating = true;
// 	const __dirname = dirname(fileURLToPath(import.meta.url));
// 	const filePath = path.resolve(__dirname, './uploads', fileName);

// 	// Проверка наличия файла
// 	if (!fs.existsSync(filePath)) {
// 		console.error(`File ${fileName} does not exist`);
// 		return;
// 	}

// 	// Получение информации о файле
// 	fs.stat(filePath, (err, stats) => {
// 		if (err) {
// 			console.error('Error getting file stats', err);
// 			return;
// 		}

// 		const fileSize = stats.size;
// 		console.log(fileSize);
// 		const header = Buffer.alloc(5); // 1 байт для флага + 4 байта для размера
// 		header.writeUInt8(0, 0); // Флаг
// 		header.writeUint32LE(fileSize, 1); // Размер файла

// 		// Отправка заголовка
// 		arduinoClient.ws.send(header, { binary: true }, (err) => {
// 			if (err) {
// 				console.error('Error sending header', err);
// 				return;
// 			}

// 			// Начало отправки данных
// 			let position = 0;
// 			const fd = fs.openSync(filePath, 'r'); // Открываем файл синхронно

// 			const sendNextChunk = async () => {
// 				await sleep(500);

// 				if (position >= fileSize) {
// 					console.log(`Firmware file ${fileName} sent successfully`);
// 					fs.closeSync(fd); // Закрываем файл
// 					return;
// 				}

// 				const buffer = Buffer.alloc(Math.min(CHUNK_SIZE, fileSize - position));
// 				fs.read(fd, buffer, 0, buffer.length, position, (err, bytesRead) => {
// 					if (err) {
// 						console.error('Error reading file chunk', err);
// 						return;
// 					}

// 					arduinoClient.ws.send(buffer, { binary: true }, (err) => {
// 						if (err) {
// 							console.error('Error sending file chunk', err);
// 							return;
// 						}
// 						position += bytesRead;
// 						console.log;
// 						sendNextChunk();
// 					});
// 				});
// 			};

// 			sendNextChunk(); // Запускаем процесс отправки
// 		});

// 		// main.isUpdating = false;
// 	});
// };
