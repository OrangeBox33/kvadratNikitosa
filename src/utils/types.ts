export type DeviceType = 0 | 1 | 2;

export type Id = number;
export type Ids = Id[];

export type Grid = string[];

export interface Pixel {
	id: Id;
	color: string;
}

export type HistoryElement = Pixel[];

export type History = HistoryElement[];

export type ChatMessage = { username: string; text: string };

export type Chat = ChatMessage[];
