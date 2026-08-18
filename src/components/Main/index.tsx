import React, { FC } from 'react';
import { useDeviceType } from '../../utils/hooks';
import { DeviceType } from '../../utils/types';
import { MainDesktop } from './Desktop';
import { MainMobileRotate } from './MobileRotate';
import { MainMobile } from './Mobile';

export const Main: FC = () => {
	const deviceType = useDeviceType();

	if (deviceType === DeviceType.MOBILE) {
		return <MainMobile />;
	}
	if (deviceType === DeviceType.MOBILE_ROTATE) {
		return <MainMobileRotate />;
	}

	return <MainDesktop />;
};
