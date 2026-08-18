import styled from 'styled-components';

export const StyledContainer = styled.button`
	flex: none;
	display: flex;
	height: var(--control-size);
	width: var(--control-size);
	justify-content: center;
	align-items: center;
	padding: 0;
	background-color: var(--bg-control);
	border: var(--border-width) solid var(--border-color);
	cursor: pointer;

	&:disabled {
		cursor: default;
		opacity: 0.5;
	}
	&:active:not(:disabled) {
		transform: scale(0.95);
	}
`;
