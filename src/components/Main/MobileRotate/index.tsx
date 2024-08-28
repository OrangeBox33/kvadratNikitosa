import React, { FC } from 'react';
import { Grid } from '../../Grid';
import { Palette1 } from '../../Palette';
import { Undo } from '../../Undo';
import {
	StyledMainContainer,
	StyledGrid,
	StyledPalette,
	StyledUndo,
	StyledPaletteUndo,
} from './styled';
import { BrushType } from '../../BrushType';

export const MainMobileRotate: FC = () => {
	return (
		<StyledMainContainer>
			<StyledPaletteUndo>
				<StyledUndo>
					<Undo />
					<BrushType />
				</StyledUndo>
				<StyledPalette>
					<Palette1 />
				</StyledPalette>
			</StyledPaletteUndo>
			<StyledGrid>
				<Grid deviceType={2} />
			</StyledGrid>
		</StyledMainContainer>
	);
};
