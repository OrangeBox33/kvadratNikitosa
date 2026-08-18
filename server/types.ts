import WebSocket from 'ws';
import { EMessageTypes } from './enums.js';
import {
	Id,
	Ids,
	Color,
	Grid,
	Pixel,
	HistoryElement,
	History,
	ChatMessage,
	Chat,
} from '../shared/types.js';

export type TArduinoClients = Set<TArduinoClient>;

export type TId = Id;
export type TIds = Ids;
export type TColor = Color;

export type TGrid = Grid;
export type TGridForArduino = number[];

export type TArduinoClient = { ws: WebSocket; isAlive: boolean; chipId?: string; name?: string };

export type TPixel = Pixel;

export type THistoryElement = HistoryElement;

export type THistory = History;

export type TChatMessage = ChatMessage;

export type TChat = Chat;

// Палитра калибровки: ключ — панельный цвет (тот, что уходит в диоды),
// значение — цвет, каким его надо рисовать на экране.
// Та же семантика, что у PALETTE_DICTIONARY в src/utils/constants.ts (ключ -> значение).
export type TPalette = Record<string, string>;

export type TDataFromClient = {
	type: EMessageTypes;
	pixels: TPixel[];
	chatMessage: TChatMessage;
	ssid: string;
	password: string;
	pathname: string;
	panel: string;
	screen: string;
};
