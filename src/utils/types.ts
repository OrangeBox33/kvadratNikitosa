export * from '../../shared/types';

// Значения 0/1/2 сохранены как были — их возвращает useDeviceType.
export enum DeviceType {
	DESKTOP = 0,
	MOBILE = 1,
	MOBILE_ROTATE = 2,
}
