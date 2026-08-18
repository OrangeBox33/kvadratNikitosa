import styled from 'styled-components';
import { Palette } from '../Palette';

export const StyledToolbar = styled.div`
	flex: none;
	display: flex;
	align-items: stretch;
	gap: var(--gap);
	width: 100%;
`;

// Основная палитра стоит в одном ряду с кнопками, поэтому её ряд ровняется
// по высоте контрола (за вычетом собственной рамки — box-sizing: border-box).
export const StyledInlinePalette = styled(Palette)`
	flex: 1;
	min-width: 0;
	--palette-row-height: calc(var(--control-size) - var(--border-width) * 2);
`;
