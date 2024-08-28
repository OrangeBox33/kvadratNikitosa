export const DEFAULT_COLOR = '#303030';
export const DEFAULT_X = 16;
export const DEFAULT_Y = 16;
export const PIXEL_SIZE = 20;
export const PIXEL_GAP = 1;
export const UNDO_SIZE = 100;
export const SIZE = DEFAULT_X * DEFAULT_Y;
export const CHAT_SIZE = 100;
export const MAX_USERNAME = 16;
export const MAX_CHAT_MESSAGE = 150;

export const PALETTE_DICTIONARY = {
	'#000000': '#323232',
	'#f0c68c': '#dee1ff',
	'#FF0000': '#FF0000',
	'#00FF00': '#00FF00',
	'#0000FF': '#0000FF',
	'#DC143C': '#f52aa4',
	'#320000': '#c90000',
	'#800080': '#d000d4',
	'#FF69B4': '#ff9cf5',
	'#B22222': '#f76891',
	'#FFFF00': '#FFFF00',
	'#FF4500': '#FF4500',
	'#7CFC00': '#5dff54',
	'#00FA9A': '#05eaff',
	'#003200': '#00a303',
	'#808000': '#7dbd3c',
	'#000028': '#030380',
	'#7FFFD4': '#7aedff',
	'#7B68EE': '#726ce0',
	'#804040': '#804040',
};

export const PALETTE1 = [
	'#000000',
	'#f0c68c',
	'#FF0000',
	'#00FF00',
	'#0000FF',
	'#DC143C',
	'#320000',
];

export const PALETTE2 = [
	'#800080',
	'#B22222',
	'#FFFF00',
	'#FF4500',
	'#7CFC00',
	'#00FA9A',
	'#003200',
	'#808000',
	'#000028',
	'#7FFFD4',
	'#7B68EE',
	'#804040',
];

export enum EBrushType {
	PENCIL = 'pencil',
	BRUSH = 'brush',
}
export const PENCIL = EBrushType.PENCIL;
export const BRUSH = EBrushType.BRUSH;
