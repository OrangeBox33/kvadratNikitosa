import styled from 'styled-components';

export const StyledContainer = styled.div`
	padding: 4px;
	height: 210px; // магическое число подобрано на глаз
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
