import { DEFAULT_COLOR, DEFAULT_X } from './constants';
import { Ids } from './types';

export const createGrid = (size: number) => {
	const grid: string[] = [];
	for (let i = 0; i < size; i++) {
		grid[i] = DEFAULT_COLOR;
	}

	return grid;
};

export const createArr = (size: number) => {
	const arr: number[] = [];
	for (let i = 0; i < size; i++) {
		arr.push(i);
	}

	return arr;
};

export const sleep = async (timer: number) => {
	return new Promise((resolve) => setTimeout(resolve, timer));
};

export const needPaintPixels = (id: number): Ids => {
	const arr = [id];
	const idMinus = id - DEFAULT_X;
	const idPlus = id + DEFAULT_X;

	// верхний ряд
	if (id < DEFAULT_X) {
		if (id === 0) {
			arr.push(id + 1, idPlus, idPlus + 1);
		} else if (id === 15) {
			arr.push(id - 1, idPlus, idPlus - 1);
		} else {
			arr.push(id - 1, id + 1, idPlus, idPlus - 1, idPlus + 1);
		}

		return arr;
	}

	// нижний ряд
	if (id > 239) {
		if (id === 240) {
			arr.push(id + 1, idMinus, idMinus + 1);
		} else if (id === 255) {
			arr.push(id - 1, idMinus, idMinus - 1);
		} else {
			arr.push(id - 1, id + 1, idMinus, idMinus - 1, idMinus + 1);
		}

		return arr;
	}

	// левый ряд
	if (id % DEFAULT_X === 0) {
		arr.push(id + 1, idMinus, idMinus + 1, idPlus, idPlus + 1);

		return arr;
	}

	// правый ряд
	if ((id + 1) % DEFAULT_X === 0) {
		arr.push(id - 1, idMinus, idMinus - 1, idPlus, idPlus - 1);

		return arr;
	}

	arr.push(id - 1, id + 1, idMinus, idMinus - 1, idMinus + 1, idPlus, idPlus - 1, idPlus + 1);

	return arr;
};
