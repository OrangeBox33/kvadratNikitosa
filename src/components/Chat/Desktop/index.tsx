import React, { FC, useState, ChangeEvent } from 'react';
import playPNG from '../../../resources/png/play.png';
import {
	StyledButtonContainer,
	StyledChatContainer,
	StyledContainer,
	StyledFlex,
	StyledInputNickname,
	StyledInputText,
	StyledLabel,
	StyledTextContainer,
} from './Chat.styled';
import { useAppDispatch } from '../../../redux/hooks';
import { sendMessage } from '../../../redux/thunk';
import { MAX_CHAT_MESSAGE, MAX_USERNAME } from '../../../utils/constants';
import { Messages } from '../../Messages/Desktop';

export const Chat: FC = () => {
	const [username, setUsername] = useState('');
	const [text, setText] = useState('');
	const dispatch = useAppDispatch();

	const changeUsername = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.currentTarget.value.length <= MAX_USERNAME) {
			setUsername(e.currentTarget.value);
		}
	};

	const changeText = (e: ChangeEvent<HTMLTextAreaElement>) => {
		if (e.currentTarget.value.length <= MAX_CHAT_MESSAGE) {
			setText(e.currentTarget.value);
		}
	};

	const submitMessage = () => {
		if (text) {
			setText('');
			dispatch(sendMessage({ username, text }));
		}
	};

	return (
		<StyledContainer>
			<StyledChatContainer>
				<StyledLabel>Chat</StyledLabel>
				<Messages />
			</StyledChatContainer>
			<StyledTextContainer>
				<StyledFlex>
					<StyledInputNickname
						placeholder="Nickname"
						spellCheck={false}
						value={username}
						onChange={changeUsername}
					/>
					<StyledButtonContainer onClick={submitMessage}>
						<img src={playPNG} alt="send" width="14px" height="14px" />
					</StyledButtonContainer>
				</StyledFlex>
				<StyledInputText
					placeholder="Text..."
					spellCheck={false}
					value={text}
					onChange={changeText}
				/>
			</StyledTextContainer>
		</StyledContainer>
	);
};
