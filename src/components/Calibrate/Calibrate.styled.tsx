import styled, { createGlobalStyle } from 'styled-components';

// Страница временная и только для десктопа, поэтому свои стили целиком,
// без index.css (там пиксельный шрифт и запрет скролла — здесь мешают).
export const CalibrateGlobalStyle = createGlobalStyle`
	body {
		margin: 0;
		background-color: #24262a;
		color: #e6e6e6;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 13px;
	}
`;

export const StyledPage = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 32px;
	padding: 24px;
`;

export const StyledColumn = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const StyledTitle = styled.div`
	font-size: 15px;
	color: #9aa0a6;
`;

export const StyledNote = styled.div`
	max-width: 260px;
	color: #9aa0a6;
	line-height: 1.5;
`;

export const StyledTargetSwatch = styled.div<{ color: string }>`
	height: 72px;
	width: 200px;
	background-color: ${({ color }) => color};
	border: 1px solid #4a4d52;
`;

export const StyledRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

export const StyledButton = styled.button<{ isActive?: boolean }>`
	min-width: 34px;
	padding: 6px 10px;
	background-color: ${({ isActive }) => (isActive ? '#4d7cff' : '#34373c')};
	color: #e6e6e6;
	border: 1px solid #4a4d52;
	border-radius: 3px;
	font-family: inherit;
	font-size: 13px;
	cursor: pointer;

	&:hover {
		border-color: #8a8f96;
	}
`;

export const StyledLabel = styled.span`
	width: 62px;
	color: #9aa0a6;
`;

// Карта плашек: та же раскладка, что на панели — слева-направо, сверху-вниз.
export const StyledMap = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 96px);
	gap: 4px;
`;

export const StyledCell = styled.div<{ color: string; isLight: boolean; isPicked: boolean }>`
	box-sizing: border-box;
	height: 72px;
	padding: 6px 8px;
	background-color: ${({ color }) => color};
	color: ${({ isLight }) => (isLight ? '#111' : '#f0f0f0')};
	border: ${({ isPicked }) => (isPicked ? '3px solid #ffffff' : '1px solid #4a4d52')};
	cursor: pointer;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`;

export const StyledCellNumber = styled.div`
	font-size: 20px;
	font-weight: bold;
`;

export const StyledCellHex = styled.div`
	font-size: 11px;
	opacity: 0.85;
`;

export const StyledNumberInput = styled.input`
	width: 52px;
	padding: 6px 8px;
	background-color: #34373c;
	color: #e6e6e6;
	border: 1px solid #4a4d52;
	border-radius: 3px;
	font-family: inherit;
	font-size: 15px;
	text-align: center;
`;

export const StyledSavedList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	max-height: 70vh;
	overflow-y: auto;
`;

export const StyledSavedRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

export const StyledSavedSwatch = styled.div<{ color: string }>`
	height: 20px;
	width: 20px;
	flex: none;
	background-color: ${({ color }) => color};
	border: 1px solid #4a4d52;
`;

// Быстрый выбор эталона: 40 ходовых цветов, 8 в ряду под пикером.
export const StyledSwatchGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(8, 24px);
	gap: 2px;
`;

export const StyledSwatch = styled.div<{ color: string; isActive: boolean }>`
	box-sizing: border-box;
	height: 24px;
	width: 24px;
	background-color: ${({ color }) => color};
	border: ${({ isActive }) => (isActive ? '3px solid #ffffff' : '1px solid #4a4d52')};
	cursor: pointer;
`;
