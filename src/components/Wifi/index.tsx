import React, { FC, useState } from 'react';
import { StyledButton, StyledContainer, StyledInput } from './styled';
import { socketWifi } from '../../socket/socketWifi';

export const Wifi: FC = () => {
	const [ssid, setSsid] = useState('');
	const [password, setPassword] = useState('');

	const changeSsid = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSsid(e.target.value);
	};

	const changePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPassword(e.target.value);
	};

	const sendData = () => {
		socketWifi.send(
			JSON.stringify({ type: 'wifi', ssid, password, pathname: window.location.pathname })
		);

		window.location.href = '/';
	};

	return (
		<StyledContainer>
			<p>WIFI settings</p>
			<p>
				Введи название сети и пароль и нажми кнопку OK, устройство перезагрузится и применит
				данные
			</p>
			<StyledInput value={ssid} placeholder="SSID" onChange={changeSsid} />
			<StyledInput value={password} placeholder="Password" onChange={changePassword} />
			<StyledButton disabled={!ssid || !password} onClick={sendData}>
				OK
			</StyledButton>
		</StyledContainer>
	);
};
