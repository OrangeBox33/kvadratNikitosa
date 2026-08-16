// Общие структуры данных, которыми обмениваются клиент и сервер.
export type Id = number;
export type Ids = Id[];
export type Color = string;

export type Grid = string[];

export type Pixel = {
	id: Id;
	color: Color;
};

export type HistoryElement = Pixel[];
export type History = HistoryElement[];

export type ChatMessage = { username: string; text: string };
export type Chat = ChatMessage[];
