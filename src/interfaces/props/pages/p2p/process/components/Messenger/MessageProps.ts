import { Message } from '@/interfaces/responses/chats/GetChatRes';

interface MessageProps {
	isSender: boolean;
	success: boolean;
	fail: boolean;
	// messageInfo: {
	//     type: "img" | "text";
	//     text?: string;
	//     url?: string;
	//     timestamp: string;
	// }
	messageInfo: Message;
}

export default MessageProps;
