import fs from 'fs';

export const DEFAULT_COLOR = '#000000';
export const DEFAULT_X = 16;
export const DEFAULT_Y = 16;
export const SIZE = DEFAULT_X * DEFAULT_Y;
export const HISTORY_SIZE = 1000;
export const CHAT_SIZE = 20;
export const CHAT_MESSAGE_SIZE = 150;
export const CHAT_USERNAME_SIZE = 16;
export const PLAY_HISTORY = '42';
export const RESET_HISTORY = '228';
export const BRIGHTNESS_DEVISION = 4;
export const TIMEOUT_BETWEEN_FRAMES = 25; // ms

export const KEYS_OPTIONS = {
	key: fs.readFileSync('./ssl/privateKey.key'), // PRIVATE KEY
	cert: fs.readFileSync('./ssl/cerfKey.pem'), // CERTIFICATE
};
