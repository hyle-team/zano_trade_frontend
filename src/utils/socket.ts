import { API_URL } from '@/constants';
import { io } from 'socket.io-client';

const SOCKET_URL = API_URL as string;

const socket = io(SOCKET_URL, {
	transports: ['websocket'],
	withCredentials: true,
});

export default socket;
