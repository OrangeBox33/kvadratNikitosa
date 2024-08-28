import React, { FC } from 'react';
import { Grid } from '../../Grid';
import { Palette1, Palette2 } from '../../Palette';
import {
	StyledGrid,
	StyledMainContainer,
	StyledPalette,
	StyledPaletteUndoDesktop,
	StyledWrapper,
} from './styled';
import { Undo } from '../../Undo';
import { BrushType } from '../../BrushType';
import { Chat } from '../../Chat/Desktop';

export const MainDesktop: FC = () => {
	return (
		<StyledMainContainer>
			<div>
				<StyledGrid>
					<Grid deviceType={0} />
					<Chat />
				</StyledGrid>
				<StyledWrapper>
					<StyledPaletteUndoDesktop>
						<Undo />
						<BrushType />
						<StyledPalette>
							<Palette1 />
						</StyledPalette>
					</StyledPaletteUndoDesktop>
					<Palette2 />
				</StyledWrapper>
			</div>
		</StyledMainContainer>
	);
};
