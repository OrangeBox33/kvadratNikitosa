import React from 'react';
import { MouseEvent, memo } from 'react';
import { StyledPixel } from './Pixel.styled';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { beginStroke, selectPixelColor } from '../../redux/slice';
import { DeviceType } from '../../utils/types';
import { PALETTE_DICTIONARY } from '../../utils/constants';
import { setAndSendPixel } from '../../redux/thunk';

interface IProps {
	id: number;
	deviceType: DeviceType;
}

/**
 * Подписан только на свой цвет. Выбранный цвет и тип кисти сюда не тянем:
 * «пиксель уже нужного цвета — ничего не делаем» и так проверяет thunk,
 * а лишние подписки перерисовывали все 256 пикселей на каждый клик по палитре.
 */
export const Pixel = memo<IProps>(({ id, deviceType }) => {
	const pixelColor = useAppSelector(selectPixelColor(id));
	const dispatch = useAppDispatch();

	const handleHover = (e: MouseEvent) => {
		if (deviceType === DeviceType.DESKTOP && e.buttons === 1) {
			dispatch(setAndSendPixel(id));
		}
	};

	const handleMouseDown = () => {
		dispatch(beginStroke());
		dispatch(setAndSendPixel(id));
	};

	return (
		<StyledPixel
			$color={PALETTE_DICTIONARY[pixelColor as keyof typeof PALETTE_DICTIONARY] || pixelColor}
			onMouseOver={handleHover}
			onMouseDown={handleMouseDown}
		/>
	);
});
