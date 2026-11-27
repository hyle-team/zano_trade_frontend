import { API_URL } from '@/constants';
import { io } from 'socket.io-client';

const legacySocket = io(API_URL as string, {
	transports: ['websocket'],
	withCredentials: true,
});

export default legacySocket;
