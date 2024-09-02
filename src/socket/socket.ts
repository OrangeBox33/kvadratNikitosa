import { addMessage, setChat, setGrid, setPixels } from '../redux/slice';
import { store } from '../redux/store';
import ReconnectingWebSocket from 'reconnecting-websocket';

export const socket = new ReconnectingWebSocket('wss://kvadratnikitosa.ru');

socket.addEventListener('message', (message) => {
	const { type, pixels, grid, chat, chatMessage } = JSON.parse(message.data);

	if (type === 'draw') {
		store.dispatch(setPixels(pixels));
	}

	if (type === 'getGrid') {
		store.dispatch(setGrid(grid));
	}

	if (type === 'getChat') {
		store.dispatch(setChat(chat));
	}

	if (type === 'sendToChat') {
		store.dispatch(addMessage(chatMessage));
	}
});
