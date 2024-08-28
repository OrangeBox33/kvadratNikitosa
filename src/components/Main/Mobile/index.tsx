import React, { FC } from 'react';
import { Grid } from '../../Grid';
import { Palette1, Palette2 } from '../../Palette';
import { Undo } from '../../Undo';
import { StyledFlexMobile, StyledMainContainer, StyledPaletteUndo, StyledWrapper } from './styled';
import { BrushType } from '../../BrushType';
import { Chat } from '../../Chat/Mobile';

export const MainMobile: FC = () => {
	return (
		<StyledMainContainer>
			<Chat />
			<StyledFlexMobile>
				<Grid deviceType={1} />
				<StyledWrapper>
					<StyledPaletteUndo>
						<Undo />
						<BrushType />
						<Palette1 />
					</StyledPaletteUndo>
					<Palette2 />
				</StyledWrapper>
			</StyledFlexMobile>
		</StyledMainContainer>
	);
};
