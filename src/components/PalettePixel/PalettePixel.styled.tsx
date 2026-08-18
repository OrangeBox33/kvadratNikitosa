import styled from 'styled-components';

// Рамка выделения всегда на месте, у неактивного цвета она прозрачная —
// иначе плашка подрастала на 8px при выборе и весь ряд дёргался.
export const StyledPalettePixel = styled.div<{ $color: string; $isActive: boolean }>`
	height: 100%;
	width: 100%;
	background-color: ${({ $color }) => $color};
	border: 4px solid ${({ $isActive }) => ($isActive ? '#ffffff' : 'transparent')};
	cursor: pointer;
`;
