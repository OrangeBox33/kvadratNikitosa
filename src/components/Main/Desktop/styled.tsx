import styled from 'styled-components';
import { BOARD_SIZE, PIXEL_GAP, PIXEL_SIZE } from '../../../utils/constants';

// Отступ между сеткой и чатом — две клетки, как было задумано в старой
// формуле marginLeft = (PIXEL_SIZE + PIXEL_GAP) * (DEFAULT_Y + 2).
const CHAT_GAP = (PIXEL_SIZE + PIXEL_GAP) * 2;
const CHAT_WIDTH = 200;
// Воздух между сеткой и инструментами (раньше — margin-top: 5vh).
const TOOLS_GAP = 24;

export const StyledMainContainer = styled.div`
	/* на десктопе размер пикселя фиксирован, поэтому и сетка фиксированная */
	--board-size: ${BOARD_SIZE}px;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: var(--bg-page);
`;

// Сцена центрируется целиком, а внутри чат ровняется по верхнему краю сетки.
export const StyledStage = styled.div`
	display: flex;
	align-items: flex-start;
	gap: ${CHAT_GAP}px;
`;

export const StyledBoardColumn = styled.div`
	display: flex;
	flex-direction: column;
	width: var(--board-size);
	gap: var(--gap);
`;

// Инструменты и палитра идут после сетки с дополнительным отступом.
export const StyledTools = styled.div`
	display: flex;
	flex-direction: column;
	gap: var(--gap);
	margin-top: ${TOOLS_GAP}px;
`;

/**
 * Чат — обычный блок в потоке рядом с сеткой. Раньше он был position:
 * absolute и ставился на место отрицательным margin-top в высоту сетки.
 */
export const StyledChatColumn = styled.div`
	flex: none;
	display: flex;
	width: ${CHAT_WIDTH}px;
	height: var(--board-size);
`;
