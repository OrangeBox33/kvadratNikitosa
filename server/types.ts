import WebSocket from 'ws';
import { EMessageTypes } from './enums';

export type TArduinoClients = Set<TArduinoClient>;

export type TId = number;
export type TIds = TId[];
export type TColor = string;

export type TGrid = string[];
export type TGridForArduino = number[];

export type TArduinoClient = { ws: WebSocket; isAlive: boolean };

export type TPixel = {
	id: TId;
	color: TColor;
};

export type THistoryElement = TPixel[];

export type THistory = THistoryElement[];

export type TChatMessage = { username: string; text: string };

export type TChat = TChatMessage[];

export type TDataFromClient = { type: EMessageTypes; pixels: TPixel[]; chatMessage: TChatMessage };
