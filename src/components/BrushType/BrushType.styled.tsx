import styled from 'styled-components';

// Рамка активного состояния занимает место всегда (у неактивной кнопки она
// прозрачная): раньше border появлялся только у активной и ряд прыгал.
export const StyledContainer = styled.button<{ $isActive: boolean }>`
	flex: none;
	display: flex;
	height: var(--control-size);
	width: var(--control-size);
	justify-content: center;
	align-items: center;
	padding: 0;
	background-color: var(--bg-control);
	border: 3px solid ${({ $isActive }) => ($isActive ? 'var(--border-active)' : 'transparent')};
	outline: var(--border-width) solid var(--border-color);
	outline-offset: calc(var(--border-width) * -1);
	color: var(--text-on-dark);
	font-size: 20px;
	cursor: pointer;

	&:active {
		transform: scale(0.95);
	}
`;

export const StyledFlex = styled.div`
	flex: none;
	display: flex;
	gap: var(--gap);
`;
