import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
	DEFAULT_X,
	DEFAULT_Y,
	UNDO_SIZE,
	PALETTE2,
	EBrushType,
	PENCIL,
	CHAT_SIZE,
} from '../utils/constants';
import { Chat, ChatMessage, Grid, History, Ids, Pixel } from '../utils/types';
import { createGrid } from '../utils/utils';

export interface MainState {
	grid: Grid;
	selectedColor: string;
	brushType: EBrushType;
	history: History;
	pendingNewStroke: boolean;
	chat: Chat;
	// Подобранные на /calibrate пары «панельный цвет -> цвет на экране».
	// Живёт на сервере (server/palette.json), сюда приходит целиком.
	palette: Record<string, string>;
}

const initialState: MainState = {
	grid: createGrid(DEFAULT_X * DEFAULT_Y),
	selectedColor: PALETTE2[2],
	brushType: PENCIL,
	history: [],
	pendingNewStroke: true,
	chat: [],
	palette: {},
};

// export const getChat =
// 	(chat: Chat): AppThunk =>
// 	async (dispatch) => {
// 		dispatch(setPixels(pixels));
// 	};

export const mainSlice = createSlice({
	name: 'main',
	initialState,
	reducers: {
		setPixels: (state, action: PayloadAction<Pixel[]>) => {
			for (const pixel of action.payload) {
				const { id, color } = pixel;
				state.grid[id] = color;
			}
		},

		beginStroke: (state) => {
			state.pendingNewStroke = true;
		},

		pushHistory: (state, action: PayloadAction<Ids>) => {
			const ids = action.payload;
			const historyElement = ids.map((id) => ({ id, color: state.grid[id] }));

			// Начало мазка (или самый первый штрих) — заводим новую группу отмены.
			// Продолжение мазка — дописываем пиксели в текущую группу.
			if (state.pendingNewStroke || state.history.length === 0) {
				state.history.push(historyElement);
				state.pendingNewStroke = false;
				if (state.history.length > UNDO_SIZE) {
					state.history.shift();
				}
			} else {
				state.history[state.history.length - 1].push(...historyElement);
			}
		},

		setSelectedColor: (state, action: PayloadAction<string>) => {
			state.selectedColor = action.payload;
		},

		popHistory: (state) => {
			state.history.pop();
		},

		setGrid: (state, action: PayloadAction<Grid>) => {
			const gridFromServer = action.payload;
			state.grid = gridFromServer;
		},

		changeBrushType: (state, action: PayloadAction<EBrushType>) => {
			state.brushType = action.payload;
		},

		setChat: (state, action: PayloadAction<Chat>) => {
			state.chat = action.payload;
		},

		setPalette: (state, action: PayloadAction<Record<string, string>>) => {
			state.palette = action.payload;
		},

		addMessage: (state, action: PayloadAction<ChatMessage>) => {
			if (state.chat.length > CHAT_SIZE) {
				state.chat.shift();
			}

			state.chat.push(action.payload);
		},
	},
});

export const selectSelectedColor = (state: MainState) => state.selectedColor;
export const selectGrid = (state: MainState) => state.grid;
export const selectPixelColor = (id: number) => (state: MainState) => state.grid[id];
export const selectEmptyHistory = (state: MainState) => state.history.length === 0;
export const selectBrushType = (state: MainState) => state.brushType;
export const selectChat = (state: MainState) => state.chat;
export const selectPalette = (state: MainState) => state.palette;

export const {
	setPixels,
	setSelectedColor,
	beginStroke,
	pushHistory,
	popHistory,
	setGrid,
	changeBrushType,
	setChat,
	addMessage,
	setPalette,
} = mainSlice.actions;

export const mainReducer = mainSlice.reducer;
