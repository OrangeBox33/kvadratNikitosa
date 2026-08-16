import { socket } from '../socket/socket';
import { BRUSH } from '../utils/constants';
import { Id, ChatMessage } from '../utils/types';
import { needPaintPixels } from '../utils/utils';
import { pushHistory, setPixels, popHistory } from './slice';
import { AppThunk } from './store';
import { EMessageTypes } from '../../shared/enums';

export const setAndSendPixel =
	(id: Id): AppThunk =>
	async (dispatch, getState) => {
		const { selectedColor, brushType, grid } = getState();

		// Кисть красит окрестность 3×3, карандаш — один пиксель.
		// В обоих случаях берём только те id, что реально меняют цвет.
		const candidateIds = brushType === BRUSH ? needPaintPixels(id) : [id];
		const idsToPaint = candidateIds.filter((pixelId) => grid[pixelId] !== selectedColor);

		if (!idsToPaint.length) {
			return;
		}

		const pixels = idsToPaint.map((pixelId) => ({ id: pixelId, color: selectedColor }));

		dispatch(pushHistory(idsToPaint));
		dispatch(setPixels(pixels));

		if (socket.readyState === socket.OPEN) {
			socket.send(JSON.stringify({ pixels, type: EMessageTypes.DRAW }));
		}
	};

export const undo = (): AppThunk => async (dispatch, getState) => {
	const { history } = getState();
	const pixels = history.at(-1);

	if (!pixels) {
		return;
	}

	dispatch(setPixels(pixels));
	dispatch(popHistory());

	if (socket.readyState === socket.OPEN) {
		const data = JSON.stringify({ pixels, type: EMessageTypes.DRAW });
		await socket.send(data);
	}
};

export const sendMessage =
	({ username, text }: ChatMessage): AppThunk =>
	async () => {
		const data = JSON.stringify({
			type: EMessageTypes.SEND_TO_CHAT,
			chatMessage: { username, text },
		});
		socket.send(data);
	};
