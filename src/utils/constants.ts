export { DEFAULT_X, DEFAULT_Y, SIZE } from '../../shared/constants';

export const DEFAULT_COLOR = '#303030';
export const PIXEL_SIZE = 20;
export const PIXEL_GAP = 1;
export const UNDO_SIZE = 100;
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
	// Подобрано глазами на /calibrate: ключ — что уходит в диоды,
	// значение — каким этот цвет рисовать на экране.
	'#C86404': '#F2A700',
	'#B8C4B8': '#C0C0C0',
	'#3C4430': '#808080',
	'#0C0C08': '#404040',
	'#FC581C': '#FF7F50',
	'#FCB800': '#FFD700',
	'#ECD43C': '#F0E68C',
	'#DCC048': '#F5DEB3',
	'#581C04': '#A0522D',
	'#A0F404': '#ADFF2F',
	'#3C981C': '#00FA9A',
	'#58B448': '#40E0D0',
	'#0C1C0C': '#008080',
	'#3880F0': '#1E90FF',
	'#040008': '#4B0082',
	'#300460': '#8A2BE2',
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
	// Подобранные на /calibrate. Переносятся в ряды по 12 — ровно
	// в ширину сетки (12 * 28px = 336px), StyledPalette их сам заворачивает.
	'#C86404',
	'#B8C4B8',
	'#3C4430',
	'#0C0C08',
	'#FC581C',
	'#FCB800',
	'#ECD43C',
	'#DCC048',
	'#581C04',
	'#A0F404',
	'#3C981C',
	'#58B448',
	'#0C1C0C',
	'#3880F0',
	'#040008',
	'#300460',
];

export enum EBrushType {
	PENCIL = 'pencil',
	BRUSH = 'brush',
}
export const PENCIL = EBrushType.PENCIL;
export const BRUSH = EBrushType.BRUSH;
