import React, { FC, useState } from 'react';
import { StyledButton, StyledContainer, StyledInput } from './styled';
import { socketWifi } from '../../socket/socketWifi';
import { EMessageTypes } from '../../../shared/enums';

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
			JSON.stringify({
				type: EMessageTypes.WIFI,
				ssid,
				password,
				pathname: window.location.pathname,
			})
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
			<StyledInput value={ssid} placeholder="SSID" onChange={changeSsid} spellCheck={false} />
			<StyledInput
				value={password}
				placeholder="Password"
				onChange={changePassword}
				spellCheck={false}
			/>
			<StyledButton type="button" disabled={!ssid || !password} onClick={sendData}>
				OK
			</StyledButton>
		</StyledContainer>
	);
};
