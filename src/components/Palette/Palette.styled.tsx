import styled from 'styled-components';

/**
 * Раскладка — грид с явным числом колонок, а не flex-wrap: перенос теперь
 * не зависит от того, во что палитра вложена, и высота ряда предсказуема
 * (раньше `height: 40px` + wrap распирало содержимое за рамку).
 * Высоту ряда раскладка может переопределить через --palette-row-height.
 */
export const StyledPalette = styled.div<{ $columns: number }>`
	display: grid;
	grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
	grid-auto-rows: var(--palette-row-height, var(--swatch-height));
	gap: 1px;
	width: 100%;
	border: var(--border-width) solid var(--border-color);
`;
