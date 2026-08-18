import React, { FC, useEffect, useRef } from 'react';
import { StyledContainer, StyledMessage, StyledText, StyledUsername } from './Messages.styled';
import { useAppSelector } from '../../redux/hooks';
import { selectChat } from '../../redux/slice';

export const Messages: FC = () => {
	const chat = useAppSelector(selectChat);
	const containerRef = useRef<HTMLDivElement>(null);

	// Крутим сам контейнер, а не scrollIntoView: тот на мобилке утягивал
	// за собой всю страницу, из-за чего его там просто отключили.
	useEffect(() => {
		const container = containerRef.current;

		if (container) {
			container.scrollTop = container.scrollHeight;
		}
	}, [chat]);

	return (
		<StyledContainer ref={containerRef}>
			{chat.map(({ username, text }, index) => (
				// по username + text ключи схлопывались, если один и тот же
				// человек дважды писал одно и то же
				<StyledMessage key={index}>
					<StyledUsername>{username}:&nbsp;</StyledUsername>
					<StyledText>{text}</StyledText>
				</StyledMessage>
			))}
		</StyledContainer>
	);
};
