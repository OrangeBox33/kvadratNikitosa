import React, { FC } from 'react';
import { Grid } from '../../Grid';
import { Toolbar } from '../../Toolbar';
import { Chat } from '../../Chat';
import { DeviceType } from '../../../utils/types';
import { PALETTE2, PALETTE_COLUMNS_MOBILE } from '../../../utils/constants';
import { StyledBoardArea, StyledMainContainer, StyledMainPalette } from './styled';

export const MainMobile: FC = () => {
	return (
		<StyledMainContainer>
			<Chat collapsible />
			<StyledBoardArea>
				<Grid deviceType={DeviceType.MOBILE} />
			</StyledBoardArea>
			<Toolbar />
			<StyledMainPalette colors={PALETTE2} columns={PALETTE_COLUMNS_MOBILE} />
		</StyledMainContainer>
	);
};
