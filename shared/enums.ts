// Типы WebSocket-сообщений между браузером и сервером.
// Значения — это те самые строки, что летят в JSON (type: '...').
export enum EMessageTypes {
	GET_GRID = 'getGrid',
	DRAW = 'draw',
	GET_CHAT = 'getChat',
	SEND_TO_CHAT = 'sendToChat',
	WIFI = 'wifi',
	OTA = 'ota',
	// Калибровка палитры: браузер шлёт подобранную пару цветов,
	// сервер копит их в своей палитре и рассылает её обратно.
	SAVE_COLOR = 'saveColor',
	GET_PALETTE = 'getPalette',
}
