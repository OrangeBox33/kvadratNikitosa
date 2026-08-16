import styled from 'styled-components';

export const StyledMainContainer = styled.div`
	height: 100vh; /* фолбэк для старых браузеров */
	height: 100dvh; /* реальная видимая высота с учётом строки адреса */
	background-color: #5b5d63;
	display: flex;
	justify-content: space-between;
`;

export const StyledGrid = styled.div`
	margin: auto 10vh auto 0;
`;

export const StyledPalette = styled.div`
	display: flex;
	margin-top: 5vh;
`;

export const StyledUndo = styled.div`
	display: flex;
	margin-top: 10vh;
`;

export const StyledFlexMobile = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	align-items: flex-end;
`;

export const StyledPaletteUndo = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	margin-left: 10vh;
	margin-bottom: 10vh;
`;

export const StyledFlexMobileRotate = styled.div`
	display: flex;
	justify-content: space-between;
`;
