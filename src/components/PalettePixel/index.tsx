import React, { FC } from 'react';
import { StyledPalettePixel } from './PalettePixel.styled';
import { PALETTE_DICTIONARY } from '../../utils/constants';

interface IProps {
	color: string;
	isActive: boolean;
	handleClick: (color: string) => void;
}

export const PalettePixel: FC<IProps> = ({ color, isActive, handleClick }) => {
	return (
		<StyledPalettePixel
			// @ts-ignore
			color={PALETTE_DICTIONARY[color] || color}
			isActive={isActive}
			onClick={() => handleClick(color)}
		/>
	);
};
