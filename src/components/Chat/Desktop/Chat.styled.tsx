import styled from 'styled-components';
import { PIXEL_SIZE, PIXEL_GAP, DEFAULT_Y } from '../../../utils/constants';

const height = (PIXEL_SIZE + PIXEL_GAP) * DEFAULT_Y - 1;
const width = ((PIXEL_SIZE + PIXEL_GAP) * DEFAULT_Y) / 1.7;
const marginLeft = (PIXEL_SIZE + PIXEL_GAP) * (DEFAULT_Y + 2);
const textHeight = 80;
const buttonSize = 26;
const labelHeight = 30;

export const StyledContainer = styled.div`
	height: ${height}px;
	width: ${width}px;
	margin-top: ${-height}px;
	margin-left: ${marginLeft}px;
	background-color: #535459;
	position: absolute;
	border: 2px solid #1c1c1c;
`;

export const StyledChatContainer = styled.div`
	box-sizing: border-box;
	height: ${height - textHeight}px;
	width: ${width}px;
	background-color: #c0c2cb;
	border: 1px solid #1c1c1c;
`;

export const StyledTextContainer = styled.div`
	box-sizing: border-box;
	height: ${textHeight}px;
	width: ${width}px;
	background-color: #c0c2cb;
	border: 1px solid #1c1c1c;
	display: flex;
	flex-direction: column;
`;

export const StyledInputNickname = styled.input`
	outline: none;
	border: none;
	padding: 2px 6px;
	box-sizing: border-box;
	background-color: #c0c2cb;
	width: ${width - buttonSize}px;
	font-size: 18px;
	border-bottom: 1px solid #1c1c1c;
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
	font-size: 20px;
`;
