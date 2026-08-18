import React, { FC, useRef } from 'react';
import { createArr } from '../../utils/utils';
import { DEFAULT_X, DEFAULT_Y } from '../../utils/constants';
import { Pixel } from '../Pixel';
import { StyledGrid } from './Grid.styled';
import { useAppDispatch } from '../../redux/hooks';
import { DeviceType } from '../../utils/types';
import { setAndSendPixel } from '../../redux/thunk';
import { beginStroke } from '../../redux/slice';

interface IProps {
	deviceType: DeviceType;
}

export const Grid: FC<IProps> = ({ deviceType }) => {
	const dispatch = useAppDispatch();
	const ref = useRef<HTMLDivElement>(null);

	// Размер и положение сетки меряем на каждое касание, а не один раз при
	// монтировании: сетка теперь резиновая, и раньше после поворота экрана
	// или скролла попадание уезжало на несколько клеток.
	const touchMove = (e: React.TouchEvent) => {
		if (!ref.current) {
			return;
		}

		const rect = ref.current.getBoundingClientRect();
		const posX = Math.floor(((e.touches[0].clientX - rect.left) / rect.width) * DEFAULT_X);
		const posY = Math.floor(((e.touches[0].clientY - rect.top) / rect.height) * DEFAULT_Y);

		if (posX >= 0 && posX < DEFAULT_X && posY >= 0 && posY < DEFAULT_Y) {
			dispatch(setAndSendPixel(posY * DEFAULT_X + posX));
		}
	};

	const touchStart = (e: React.TouchEvent) => {
		dispatch(beginStroke());
		touchMove(e);
	};

	return (
		<StyledGrid ref={ref} onTouchStart={touchStart} onTouchMove={touchMove}>
			{createArr(DEFAULT_X * DEFAULT_Y).map((v, index) => (
				<Pixel key={index} id={index} deviceType={deviceType} />
			))}
		</StyledGrid>
	);
};
