import styled from 'styled-components';

export const StyledContainer = styled.button<{ isActive: boolean }>`
	margin-top: 2px;
	margin-left: 2px;
	border: none;
	outline: none;
	display: flex;
	height: 40px;
	width: 40px;
	justify-content: center;
	align-items: center;
	background-color: #313134;
	${({ isActive }) => isActive && '3px solid #808080'};
	border: ${({ isActive }) => `${isActive ? '3px  solid #808080' : ''}`};
	color: #d9d9d9;
	font-size: 20px;
	outline: 2px solid #1c1c1c;
	&:hover {
		cursor: pointer;
	}
	&:active {
		transform: scale(0.95);
	}
`;

export const StyledFlex = styled.div`
	display: flex;
`;
