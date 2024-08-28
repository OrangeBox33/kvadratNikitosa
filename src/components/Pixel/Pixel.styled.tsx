import styled from 'styled-components';
import { PIXEL_SIZE } from '../../utils/constants';

export const StyledPixel = styled.div<{ color: string }>`
	height: ${PIXEL_SIZE}px;
	width: ${PIXEL_SIZE}px;
	background-color: ${({ color }) => color};
`;
