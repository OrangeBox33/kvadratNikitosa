import React, { FC } from 'react';
import undoPNG from '../../resources/png/undo.png';
import { StyledContainer } from './Undo.styled';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectEmptyHistory } from '../../redux/slice';
import { undo } from '../../redux/thunk';

export const Undo: FC = () => {
	const dispatch = useAppDispatch();
	const emptyHistory = useAppSelector(selectEmptyHistory);

	const handleClick = () => {
		dispatch(undo());
	};

	return (
		<StyledContainer onClick={handleClick} disabled={emptyHistory}>
			<img src={undoPNG} alt="undo" width="26px" height="26px" />
		</StyledContainer>
	);
};
