import React, { FC, useEffect, useRef, useState } from 'react';
import { createArr } from '../../utils/utils';
import { DEFAULT_X, DEFAULT_Y, PIXEL_GAP, PIXEL_SIZE } from '../../utils/constants';
import { Pixel } from '../Pixel';
import { StyledGrid } from './Grid.styled';
import { useAppDispatch } from '../../redux/hooks';
import { DeviceType } from '../../utils/types';
import { setAndSendPixel } from '../../redux/thunk';

interface IProps {
	deviceType: DeviceType;
}

export const Grid: FC<IProps> = ({ deviceType }) => {
	const dispatch = useAppDispatch();
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			const { left, top } = ref.current.getBoundingClientRect();
			setOffset({ x: left, y: top });
		}
	}, [ref]);

	const touchMove = (e: React.TouchEvent) => {
		const x = e.touches[0].clientX - offset.x;
		const y = e.touches[0].clientY - offset.y;

		const posX = Math.floor(x / (PIXEL_SIZE + PIXEL_GAP));
		const posY = Math.floor(y / (PIXEL_SIZE + PIXEL_GAP));

		if (posX >= 0 && posX < DEFAULT_X && posY >= 0 && posY < DEFAULT_Y) {
			const id = posY * DEFAULT_X + posX;

			dispatch(setAndSendPixel(id));
		}
	};

	return (
		<StyledGrid ref={ref} onTouchStart={touchMove} onTouchMove={touchMove}>
			{createArr(DEFAULT_X * DEFAULT_Y).map((v, index) => (
				<Pixel key={index} id={index} deviceType={deviceType} />
			))}
		</StyledGrid>
	);
};
