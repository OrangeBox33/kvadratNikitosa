import React from 'react';
import { MouseEvent, memo } from 'react';
import { StyledPixel } from './Pixel.styled';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { beginStroke, selectBrushType, selectPixelColor, selectSelectedColor } from '../../redux/slice';
import { DeviceType } from '../../utils/types';
import { PALETTE_DICTIONARY, PENCIL } from '../../utils/constants';
import { setAndSendPixel } from '../../redux/thunk';

interface IProps {
	id: number;
	deviceType: DeviceType;
}

export const Pixel = memo<IProps>(({ id, deviceType }) => {
	const pixelColor = useAppSelector(selectPixelColor(id));
	const selectedColor = useAppSelector(selectSelectedColor);
	const brushType = useAppSelector(selectBrushType);
	const dispatch = useAppDispatch();

	const handleHover = (e: MouseEvent) => {
		if (deviceType === 0 && e.buttons === 1) {
			if (brushType === PENCIL && pixelColor === selectedColor) {
				return;
			}
			dispatch(setAndSendPixel(id));
		}
	};

	const handleMouseDown = () => {
		dispatch(beginStroke());
		if (brushType === PENCIL && pixelColor === selectedColor) {
			return;
		}
		dispatch(setAndSendPixel(id));
	};

	return (
		<StyledPixel
			// @ts-ignore
			color={PALETTE_DICTIONARY[pixelColor] || pixelColor}
			onMouseOver={handleHover}
			onMouseDown={handleMouseDown}
		></StyledPixel>
	);
});
