import styled from 'styled-components';
import { PIXEL_SIZE, PIXEL_GAP, DEFAULT_Y } from '../../../utils/constants';

const gridHeight = (PIXEL_SIZE + PIXEL_GAP) * DEFAULT_Y;
const labelHeight = 30;
const windowHeight = window.screen.height;

export const StyledContainer = styled.div`
	padding: 4px;
	height: calc(${windowHeight - gridHeight - 44 - labelHeight - labelHeight + 4}px - 35vh);
	display: flex;
	flex-direction: column;
	gap: 10px;
	overflow-y: scroll;
	overflow-x: hidden;
`;

export const StyledMessage = styled.div``;

export const StyledUsername = styled.span`
	font-style: italic;
	float: left;
	line-height: 12px;
	font-size: 14px;
	font-weight: 700;
`;

export const StyledText = styled.span`
	font-size: 16px;
	line-height: 14px;
	display: block;
	margin-left: 6px;
	margin-top: -2px;
	color: #545454;
`;
