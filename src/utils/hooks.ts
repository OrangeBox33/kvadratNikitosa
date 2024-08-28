import { useState, useEffect } from 'react';

export const useDeviceType = () => {
	const [device, setDevice] = useState(1);

	useEffect(() => {
		const handleResize = () => {
			const height = window.innerHeight;
			const width = window.innerWidth;

			if (height > width) {
				setDevice(1);
			} else if (height < 500) {
				setDevice(2);
			} else setDevice(0);
		};

		handleResize();

		window.addEventListener('resize', handleResize);

		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return device;
};
