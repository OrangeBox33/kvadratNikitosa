import React, { FC } from 'react';
import { Grid } from '../../Grid';
import { Toolbar } from '../../Toolbar';
import { Chat } from '../../Chat';
import { DeviceType } from '../../../utils/types';
import { PALETTE2, PALETTE_COLUMNS_DESKTOP } from '../../../utils/constants';
import { StyledBoardArea, StyledMainContainer, StyledMainPalette, StyledSideColumn } from './styled';

export const MainMobileRotate: FC = () => {
	return (
		<StyledMainContainer>
			<StyledSideColumn>
				<Chat />
				<Toolbar />
				<StyledMainPalette colors={PALETTE2} columns={PALETTE_COLUMNS_DESKTOP} />
			</StyledSideColumn>
			<StyledBoardArea>
				<Grid deviceType={DeviceType.MOBILE_ROTATE} />
			</StyledBoardArea>
		</StyledMainContainer>
	);
};
