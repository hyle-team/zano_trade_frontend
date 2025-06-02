import { UserChatData } from '../user/GetUserRes';

interface GetAllChatsRes {
	success: true;
	data: UserChatData[];
}

export default GetAllChatsRes;
