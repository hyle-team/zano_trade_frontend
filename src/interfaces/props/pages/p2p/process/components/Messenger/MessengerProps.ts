import { Message } from '@/interfaces/responses/chats/GetChatRes';
import { Dispatch, SetStateAction } from 'react';

interface MessengerProps {
	alias: string;
	address: string;
	isOwner: boolean;
	finishState: 'confirmed' | 'canceled' | null;
	chatId: string;
	value: Message[];
	setValue: Dispatch<SetStateAction<Message[]>>;
	maxChunks: number;
	scrollTrigger: boolean;
}

export default MessengerProps;
