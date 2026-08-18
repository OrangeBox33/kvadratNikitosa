import styled from 'styled-components';

// Размера нет намеренно: ячейка получает его от трека грида (1fr),
// поэтому сетка масштабируется целиком, без пересчёта пикселя.
export const StyledPixel = styled.div<{ $color: string }>`
	background-color: ${({ $color }) => $color};
`;
