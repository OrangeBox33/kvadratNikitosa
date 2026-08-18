import { useState, useEffect } from 'react';
import { DeviceType } from './types';

// Ниже этой высоты альбомная раскладка перестаёт быть «телефоном боком»
// и становится обычным широким экраном (ноутбук, планшет).
const LANDSCAPE_MAX_HEIGHT = 500;

export const useDeviceType = () => {
	const [device, setDevice] = useState<DeviceType>(() => getDeviceType());

	useEffect(() => {
		const handleResize = () => setDevice(getDeviceType());

		handleResize();
		window.addEventListener('resize', handleResize);

		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return device;
};

// Считается синхронно и при первом рендере тоже — иначе десктоп успевал
// показать мобильную раскладку и перескочить.
const getDeviceType = (): DeviceType => {
	if (window.innerHeight > window.innerWidth) {
		return DeviceType.MOBILE;
	}

	return window.innerHeight < LANDSCAPE_MAX_HEIGHT ? DeviceType.MOBILE_ROTATE : DeviceType.DESKTOP;
};
