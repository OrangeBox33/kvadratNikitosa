import React, { FC } from 'react';
import { PALETTE1, PALETTE2 } from '../../utils/constants';
import { PalettePixel } from '../PalettePixel';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectSelectedColor, setSelectedColor } from '../../redux/slice';
import { StyledPalette } from './Palette.styled';

export const Palette1: FC = () => {
	const selectedColor = useAppSelector(selectSelectedColor);
	const dispatch = useAppDispatch();

	const handleClick = (color: string) => dispatch(setSelectedColor(color));

	return (
		<StyledPalette>
			{PALETTE1.map((color) => (
				<PalettePixel
					key={color}
					color={color}
					isActive={color === selectedColor}
					handleClick={handleClick}
				/>
			))}
		</StyledPalette>
	);
};

export const Palette2: FC = () => {
	const selectedColor = useAppSelector(selectSelectedColor);
	const dispatch = useAppDispatch();

	const handleClick = (color: string) => dispatch(setSelectedColor(color));

	return (
		<StyledPalette>
			{PALETTE2.map((color) => (
				<PalettePixel
					key={color}
					color={color}
					isActive={color === selectedColor}
					handleClick={handleClick}
				/>
			))}
		</StyledPalette>
	);
};
