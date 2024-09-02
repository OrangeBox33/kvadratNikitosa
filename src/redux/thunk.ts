import { socket } from '../socket/socket';
import { BRUSH, PENCIL } from '../utils/constants';
import { Id, ChatMessage } from '../utils/types';
import { needPaintPixels } from '../utils/utils';
import { pushHistory, setPixels, popHistory } from './slice';
import { AppThunk } from './store';

export const setAndSendPixel =
	(id: Id): AppThunk =>
	async (dispatch, getState) => {
		const { selectedColor, brushType, grid } = getState();
		if (brushType === BRUSH) {
			const allNeedPaintIds = needPaintPixels(id);

			const realNeedPaintIds = allNeedPaintIds.filter((id) => grid[id] !== selectedColor);

			if (realNeedPaintIds.length) {
				const pixels = realNeedPaintIds.map((id) => ({ id, color: selectedColor }));

				dispatch(pushHistory(realNeedPaintIds));
				dispatch(setPixels(pixels));

				if (socket.readyState === socket.OPEN) {
					const data = JSON.stringify({ pixels, type: 'draw' });
					await socket.send(data);
				}
			}
		}

		if (brushType === PENCIL) {
			const pixels = [{ id, color: selectedColor }];

			dispatch(pushHistory([id]));
			dispatch(setPixels(pixels));

			if (socket.readyState === socket.OPEN) {
				const data = JSON.stringify({ pixels, type: 'draw' });
				await socket.send(data);
			}
		}
	};

export const undo = (): AppThunk => async (dispatch, getState) => {
	const { history } = getState();
	const pixels = history.at(-1);

	dispatch(setPixels(pixels!));
	dispatch(popHistory());

	if (socket.readyState === socket.OPEN) {
		const data = JSON.stringify({ pixels, type: 'draw' });
		await socket.send(data);
	}
};

export const sendMessage =
	({ username, text }: ChatMessage): AppThunk =>
	async () => {
		const data = JSON.stringify({ type: 'sendToChat', chatMessage: { username, text } });
		socket.send(data);
	};
