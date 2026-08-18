import styled from 'styled-components';
import { BOARD_SIZE, DEFAULT_X, DEFAULT_Y, PIXEL_GAP } from '../../utils/constants';

/**
 * Сторона сетки приходит из раскладки переменной --board-size: на десктопе это
 * фиксированные BOARD_SIZE px, на мобилке и в альбоме — min() от свободного
 * места контейнера. Сами ячейки заданы в 1fr и подстраиваются, поэтому
 * PIXEL_SIZE в вёрстке пикселя больше не участвует.
 */
export const StyledGrid = styled.div`
	flex: none;
	/* фолбэк для браузеров без cq-единиц: если --board-size не вычислится,
	   останутся эти две строки и сетка будет как на десктопе */
	width: ${BOARD_SIZE}px;
	height: ${BOARD_SIZE}px;
	width: var(--board-size, ${BOARD_SIZE}px);
	height: var(--board-size, ${BOARD_SIZE}px);
	display: grid;
	grid-template-columns: repeat(${DEFAULT_X}, 1fr);
	grid-template-rows: repeat(${DEFAULT_Y}, 1fr);
	gap: ${PIXEL_GAP}px;
	touch-action: none;
`;
