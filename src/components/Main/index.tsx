import React, { FC } from 'react';
import { useDeviceType } from '../../utils/hooks';
import { MainDesktop } from './Desktop';
import { MainMobileRotate } from './MobileRotate';
import { MainMobile } from './Mobile';

export const Main: FC = () => {
	const deviceType = useDeviceType();

	if (deviceType === 0) {
		return <MainDesktop />;
	}
	if (deviceType === 1) {
		return <MainMobile />;
	}
	if (deviceType === 2) {
		return <MainMobileRotate />;
	}

	return null;
};
