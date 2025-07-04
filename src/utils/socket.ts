import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL as string;

const socket = io(SOCKET_URL, {
	transports: ['websocket'],
	withCredentials: true,
});

export default socket;
