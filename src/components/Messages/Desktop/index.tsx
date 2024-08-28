import React, { FC, useEffect, useRef } from 'react';
import { StyledContainer, StyledMessage, StyledText, StyledUsername } from './Messages.styled';
import { useAppSelector } from '../../../redux/hooks';
import { selectChat } from '../../../redux/slice';

export const Messages: FC = () => {
	const chat = useAppSelector(selectChat);
	const divRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (divRef.current) {
			divRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [chat]);

	return (
		<StyledContainer>
			{chat.map(({ username, text }) => (
				<StyledMessage key={username + text}>
					<StyledUsername>{username}:&nbsp;</StyledUsername>
					<StyledText>{text}</StyledText>
				</StyledMessage>
			))}
			<div ref={divRef}></div>
		</StyledContainer>
	);
};
