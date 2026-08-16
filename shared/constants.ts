// Общие для клиента и сервера константы. Только значения, которые
// ДОЛЖНЫ совпадать с обеих сторон (размер сетки). Всё, что отличается
// по слоям (цвет пустого пикселя, размеры чата/истории и т.п.),
// остаётся в src/utils/constants.ts и server/constants.ts.

export const DEFAULT_X = 16;
export const DEFAULT_Y = 16;
export const SIZE = DEFAULT_X * DEFAULT_Y;
