import styled from 'styled-components';
import { PIXEL_SIZE, PIXEL_GAP, DEFAULT_Y, DEFAULT_X } from '../../../utils/constants';

const gridHeight = (PIXEL_SIZE + PIXEL_GAP) * DEFAULT_Y;
const gridWidth = (PIXEL_SIZE + PIXEL_GAP) * DEFAULT_X;
const textHeight = 100;
const buttonSize = 26;
const labelHeight = 24;
const windowHeight = window.screen.height;

export const StyledContainer = styled.div`
	height: calc(${windowHeight - gridHeight - 44}px - 35vh);
	width: ${gridWidth}px;
	margin-bottom: 3vh;
	background-color: #535459;
	border: 2px solid #1c1c1c;
`;

export const StyledChatContainer = styled.div`
	box-sizing: border-box;
	height: calc(${windowHeight - gridHeight - 44}px - 35vh);
	/* width: ${gridWidth}px; */
	background-color: #c0c2cb;
`;

export const StyledTextContainer = styled.div`
	box-sizing: border-box;
	position: relative;
	height: ${textHeight}px;
	width: calc(100% + 4px);
	margin-left: -2px;
	margin-top: -1px;
	background-color: #c0c2cb;
	border: 2px solid #1c1c1c;
	display: flex;
	flex-direction: column;
	z-index: 2;
`;

export const StyledInputNickname = styled.input`
	outline: none;
	border: none;
	padding: 2px 6px;
	box-sizing: border-box;
	background-color: #c0c2cb;
	font-size: 18px;
	border-bottom: 1px solid #1c1c1c;
	width: 100%;
`;

export const StyledInputText = styled.textarea`
	outline: none;
	border: none;
	resize: none;
	padding: 2px 6px;
	box-sizing: border-box;
	background-color: #c0c2cb;
	width: 100%;
	height: 100%;
	font-size: 14px;
	border-bottom: 1px solid #1c1c1c;
`;

export const StyledFlex = styled.div`
	display: flex;
`;

export const StyledButtonContainer = styled.button`
	outline: none;
	display: flex;
	height: ${buttonSize}px;
	width: ${buttonSize}px;
	justify-content: center;
	align-items: center;
	background-color: #313134;
	border: none;
	box-sizing: border-box;
	padding: 0;
	&:hover {
		cursor: pointer;
	}
	&:active {
		transform: scale(0.95);
	}
`;

export const StyledLabel = styled.span`
	box-sizing: border-box;
	outline: none;
	display: flex;
	height: ${labelHeight}px;
	width: 100%;
	justify-content: center;
	align-items: center;
	background-color: #313134;
	border-bottom: 2px solid #1c1c1c;
	color: #d9d9d9;
	font-size: 16px;
`;

export const StyledOpenEditor = styled(StyledLabel)`
	border-top: 2px solid #1c1c1c;
	border-bottom: 0;
`;
