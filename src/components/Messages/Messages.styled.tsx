import styled from 'styled-components';

/**
 * Высоты нет: контейнер забирает остаток родителя (flex: 1) и скроллится
 * внутри себя. `min-height: 0` обязателен — без него flex-элемент не
 * сжимается меньше содержимого, скролл ломается, и высоту приходится
 * вбивать руками (раньше здесь стояли 210px и calc от window.screen.height).
 */
export const StyledContainer = styled.div`
	flex: 1;
	min-height: 0;
	padding: 4px;
	background-color: var(--bg-field);
	display: flex;
	flex-direction: column;
	gap: 10px;
	overflow-y: auto;
	overflow-x: hidden;
	/* скролл чата не «пробивается» на страницу */
	overscroll-behavior: contain;
`;

// PixelFont отдаёт завышенные метрики строки, поэтому line-height меньше
// единицы. Правильнее один раз поправить сам @font-face (ascent-override),
// но это заметно сдвинет текст везде — оставлено на отдельный заход.
export const StyledMessage = styled.div`
	line-height: 0.9;
	overflow-wrap: anywhere;
`;

export const StyledUsername = styled.span`
	font-style: italic;
	font-size: 14px;
	font-weight: 700;
`;

export const StyledText = styled.span`
	font-size: 16px;
	color: var(--text-muted);
`;
