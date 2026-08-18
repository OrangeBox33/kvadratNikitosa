import React, { FC } from 'react';
import { StyledContainer, StyledFlex } from './BrushType.styled';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { changeBrushType, selectBrushType } from '../../redux/slice';
import { EBrushType } from '../../utils/constants';

export const BrushType: FC = () => {
	const dispatch = useAppDispatch();
	const brushType = useAppSelector(selectBrushType);

	const handleClick = (newBrushType: EBrushType) => () => {
		dispatch(changeBrushType(newBrushType));
	};

	return (
		<StyledFlex>
			<StyledContainer
				type="button"
				onClick={handleClick(EBrushType.PENCIL)}
				$isActive={brushType === EBrushType.PENCIL}
			>
				<span>1x1</span>
			</StyledContainer>
			<StyledContainer
				type="button"
				onClick={handleClick(EBrushType.BRUSH)}
				$isActive={brushType === EBrushType.BRUSH}
			>
				<span>3x3</span>
			</StyledContainer>
		</StyledFlex>
	);
};
