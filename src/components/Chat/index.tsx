import React, { FC, useState, ChangeEvent } from 'react';
import playPNG from '../../resources/png/play.png';
import {
	StyledBar,
	StyledEditor,
	StyledInputNickname,
	StyledInputText,
	StyledLabel,
	StyledOverlayPanel,
	StyledPanel,
	StyledRow,
	StyledSendButton,
} from './Chat.styled';
import { useAppDispatch } from '../../redux/hooks';
import { sendMessage } from '../../redux/thunk';
import { MAX_CHAT_MESSAGE, MAX_USERNAME } from '../../utils/constants';
import { Messages } from '../Messages';

interface IProps {
	/**
	 * Мобильный режим: чат свёрнут в полоску-заголовок и раскрывается поверх
	 * сетки по тапу. Так вся сетка и вся палитра помещаются на один экран.
	 */
	collapsible?: boolean;
}

export const Chat: FC<IProps> = ({ collapsible = false }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [username, setUsername] = useState('');
	const [text, setText] = useState('');
	const dispatch = useAppDispatch();

	const toggleIsOpen = () => setIsOpen((currentIsOpen) => !currentIsOpen);

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

	const editor = (
		<StyledEditor>
			<StyledRow>
				<StyledInputNickname
					placeholder="Nickname"
					spellCheck={false}
					value={username}
					onChange={changeUsername}
				/>
				<StyledSendButton type="button" onClick={submitMessage}>
					<img src={playPNG} alt="send" width="14" height="14" />
				</StyledSendButton>
			</StyledRow>
			<StyledInputText
				placeholder="Text..."
				spellCheck={false}
				value={text}
				onChange={changeText}
			/>
		</StyledEditor>
	);

	if (!collapsible) {
		return (
			<StyledPanel>
				<StyledLabel>Chat</StyledLabel>
				<Messages />
				{editor}
			</StyledPanel>
		);
	}

	return (
		<>
			<StyledBar type="button" onClick={toggleIsOpen}>
				{isOpen ? 'Close chat' : 'Chat'}
			</StyledBar>
			{isOpen && (
				<StyledOverlayPanel>
					<Messages />
					{editor}
				</StyledOverlayPanel>
			)}
		</>
	);
};
