import styled from 'styled-components';

export const StyledPalettePixel = styled.div<{ color: string; isActive: boolean }>`
	box-sizing: border-box;
	height: 40px;
	width: 28px;
	background-color: ${({ color }) => color};
	border: ${({ isActive }) => (isActive ? '4px solid white' : 'none')};
`;
