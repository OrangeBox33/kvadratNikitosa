import styled from 'styled-components';
import { PIXEL_GAP } from '../../utils/constants';

export const StyledGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(16, 1fr);
	grid-template-rows: repeat(16, 1fr);
	grid-column-gap: ${PIXEL_GAP}px;
	grid-row-gap: ${PIXEL_GAP}px;
	touch-action: none;
`;
