import React, { FC } from 'react';
import { Undo } from '../Undo';
import { BrushType } from '../BrushType';
import { PALETTE1 } from '../../utils/constants';
import { StyledInlinePalette, StyledToolbar } from './Toolbar.styled';

// Ряд инструментов одинаков во всех трёх раскладках, поэтому собран здесь,
// а не переклеен по Main/Desktop, Main/Mobile и Main/MobileRotate.
export const Toolbar: FC = () => {
	return (
		<StyledToolbar>
			<Undo />
			<BrushType />
			<StyledInlinePalette colors={PALETTE1} columns={PALETTE1.length} />
		</StyledToolbar>
	);
};
