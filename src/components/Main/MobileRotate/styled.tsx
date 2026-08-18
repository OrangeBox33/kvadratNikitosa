import styled from 'styled-components';
import { Palette } from '../../Palette';

export const StyledMainContainer = styled.div`
	position: relative;
	height: 100%;
	padding: var(--pad);
	display: flex;
	gap: var(--gap);
	background-color: var(--bg-page);
	overflow: hidden;
`;

// Сетка прижата к правому краю и упирается в высоту экрана; max-width не даёт
// ей съесть больше половины ширины на совсем узких экранах.
export const StyledBoardArea = styled.div`
	flex: none;
	height: 100%;
	aspect-ratio: 1;
	max-width: 55%;
	container-type: size;
	display: grid;
	place-items: center;
	/* Переменную объявляем на детях, а не на самом контейнере: cq-единицы
	   обязаны считаться относительно ЭТОГО блока, а элемент не может быть
	   контейнером для самого себя. */
	> * {
		--board-size: min(100cqw, 100cqh);
	}
`;

// Слева — чат и инструменты. Чат тянется, инструменты держат свою высоту.
export const StyledSideColumn = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: var(--gap);
`;

// Палитра держит свою высоту: сжимается только чат.
export const StyledMainPalette = styled(Palette)`
	flex: none;
`;
