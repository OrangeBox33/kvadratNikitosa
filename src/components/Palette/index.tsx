import React, { FC } from 'react';
import { PalettePixel } from '../PalettePixel';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectSelectedColor, setSelectedColor } from '../../redux/slice';
import { StyledPalette } from './Palette.styled';

interface IProps {
	colors: string[];
	columns: number;
	// нужен, чтобы раскладка могла обернуть палитру через styled(Palette)
	className?: string;
}

export const Palette: FC<IProps> = ({ colors, columns, className }) => {
	const selectedColor = useAppSelector(selectSelectedColor);
	const dispatch = useAppDispatch();

	const handleClick = (color: string) => dispatch(setSelectedColor(color));

	return (
		<StyledPalette $columns={columns} className={className}>
			{colors.map((color) => (
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
