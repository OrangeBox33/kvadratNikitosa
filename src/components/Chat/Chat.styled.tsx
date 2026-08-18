import styled, { css } from 'styled-components';

// Высота поля ввода — единственная жёсткая величина в чате: это осознанный
// размер «двух строк текста», а не подгонка под соседей.
const EDITOR_HEIGHT = 100;

const surface = css`
	display: flex;
	flex-direction: column;
	min-height: 0;
	background-color: var(--bg-panel);
	border: var(--border-width) solid var(--border-color);
`;

// Обычная панель: занимает всё, что дал ей родитель.
export const StyledPanel = styled.div`
	${surface};
	/* flex: 1 — чтобы забирать остаток в колонке (альбом);
	   height/width 100% — чтобы заполнять отведённый блок (десктоп) */
	flex: 1;
	height: 100%;
	width: 100%;
`;

/**
 * Раскрытый чат на мобилке. Лежит поверх сетки, а не двигает её: пока
 * читаешь чат, рисовать всё равно нельзя, зато сетка не меняет размер
 * туда-сюда и координаты касания не «плывут».
 * Отсчитывается от StyledMainContainer (у него position: relative).
 */
export const StyledOverlayPanel = styled.div`
	${surface};
	position: absolute;
	top: calc(var(--pad) + var(--bar-height) + var(--gap));
	right: var(--pad);
	bottom: var(--pad);
	left: var(--pad);
	z-index: 2;
`;

const barLook = css`
	flex: none;
	box-sizing: border-box;
	display: flex;
	height: var(--bar-height);
	width: 100%;
	justify-content: center;
	align-items: center;
	padding: 0;
	background-color: var(--bg-control);
	border: none;
	border-bottom: var(--border-width) solid var(--border-color);
	color: var(--text-on-dark);
	font-size: 16px;
`;

export const StyledLabel = styled.span`
	${barLook};
`;

// Тот же вид, но кликабельно — сворачивает/раскрывает чат на мобилке.
export const StyledBar = styled.button`
	${barLook};
	font-family: 'PixelFont';
	border: var(--border-width) solid var(--border-color);
	cursor: pointer;
`;

export const StyledEditor = styled.div`
	flex: none;
	height: ${EDITOR_HEIGHT}px;
	display: flex;
	flex-direction: column;
	background-color: var(--bg-field);
	border-top: var(--border-width) solid var(--border-color);
`;

export const StyledRow = styled.div`
	flex: none;
	display: flex;
`;

export const StyledInputNickname = styled.input`
	flex: 1;
	/* без этого input не даёт flex-строке сжаться и ломает ширину */
	min-width: 0;
	outline: none;
	border: none;
	border-bottom: 1px solid var(--border-color);
	padding: 2px 6px;
	background-color: var(--bg-field);
	font-size: 18px;
`;

export const StyledInputText = styled.textarea`
	flex: 1;
	min-height: 0;
	outline: none;
	border: none;
	resize: none;
	padding: 2px 6px;
	background-color: var(--bg-field);
	font-size: 14px;
`;

export const StyledSendButton = styled.button`
	flex: none;
	display: flex;
	height: var(--icon-size);
	width: var(--icon-size);
	justify-content: center;
	align-items: center;
	padding: 0;
	background-color: var(--bg-control);
	border: none;
	cursor: pointer;

	&:active {
		transform: scale(0.95);
	}
`;
