import React, { FC } from 'react';
import { socketUpdate } from '../../socket/socketUpdate';
import { EMessageTypes } from '../../../shared/enums';

export const Update: FC = () => {
	const sendData = () => {
		socketUpdate.send(
			JSON.stringify({
				type: EMessageTypes.OTA,
				pathname: window.location.pathname,
			})
		);

		window.location.href = '/';
	};

	return (
		<div>
			<p>Обновление прошивки</p>
			<p>
				Нажми кнопку — панель сама скачает новую прошивку по http и перезагрузится. Заранее
				положи собранный .bin туда, откуда его качает скетч.
			</p>
			<button onClick={sendData}>Обновить</button>
		</div>
	);
};
