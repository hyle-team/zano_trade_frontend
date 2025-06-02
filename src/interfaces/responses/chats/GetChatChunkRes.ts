import { Message } from './GetChatRes';

interface GetChatChunkRes {
	success: true;
	data: Message[];
}

export default GetChatChunkRes;
