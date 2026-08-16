import { addMessage, setChat, setGrid, setPixels } from '../redux/slice';
import { store } from '../redux/store';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { EMessageTypes } from '../../shared/enums';

export const socket = new ReconnectingWebSocket('wss://kvadratnikitosa.ru');

socket.addEventListener('message', (message) => {
	const { type, pixels, grid, chat, chatMessage } = JSON.parse(message.data);

	if (type === EMessageTypes.DRAW) {
		store.dispatch(setPixels(pixels));
	}

	if (type === EMessageTypes.GET_GRID) {
		store.dispatch(setGrid(grid));
	}

	if (type === EMessageTypes.GET_CHAT) {
		store.dispatch(setChat(chat));
	}

	if (type === EMessageTypes.SEND_TO_CHAT) {
		store.dispatch(addMessage(chatMessage));
	}
});
