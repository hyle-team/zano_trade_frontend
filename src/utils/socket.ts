import { API_URL } from '@/constants';
import { io } from 'socket.io-client';

const socket = io(API_URL as string, {
	transports: ['websocket'],
	withCredentials: true,
});

export const SocketEvent = {
	SUBSCRIBE_PAIR: 'subscribe-pair',
	UNSUBSCRIBE_PAIR: 'unsubscribe-pair',
	SUBSCRIBE_AUTHORIZED_EVENTS: 'subscribe-authorized-events',
	UNSUBSCRIBE_AUTHORIZED_EVENTS: 'unsubscribe-authorized-events',
	NEW_ORDER_PUBLIC: 'new-order-public',
	CANCEL_ORDER_PUBLIC: 'cancel-order-public',
	TRADE_PERFORMED_PUBLIC: 'trade-performed-public',
	NEW_ORDER_MATCH: 'new-order-match',
	NEW_SWAP_PROPOSAL: 'new-swap-proposal',
	SWAP_PROPOSAL_ACCEPTED: 'swap-proposal-accepted',
} as const;

export const PAIR_PUBLIC_EVENTS = [
	SocketEvent.NEW_ORDER_PUBLIC,
	SocketEvent.CANCEL_ORDER_PUBLIC,
	SocketEvent.TRADE_PERFORMED_PUBLIC,
] as const;

export const AUTHORIZED_EVENTS = [
	SocketEvent.NEW_ORDER_MATCH,
	SocketEvent.NEW_SWAP_PROPOSAL,
	SocketEvent.SWAP_PROPOSAL_ACCEPTED,
] as const;

const subscriptionCounts = new Map<string, number>();

function refCountedSubscription(key: string, subscribe: () => void, unsubscribe: () => void) {
	const count = subscriptionCounts.get(key) ?? 0;
	subscriptionCounts.set(key, count + 1);

	if (count === 0) {
		subscribe();
		socket.on('connect', subscribe);
	}

	let released = false;

	return () => {
		if (released) return;
		released = true;

		const current = subscriptionCounts.get(key) ?? 1;

		if (current > 1) {
			subscriptionCounts.set(key, current - 1);
			return;
		}

		subscriptionCounts.delete(key);
		socket.off('connect', subscribe);
		unsubscribe();
	};
}

const pairSubscribers = new Map<string, () => void>();
const authorizedSubscribers = new Map<string, () => void>();

export function subscribePair(pairId: string) {
	const key = `pair:${pairId}`;

	if (!pairSubscribers.has(key)) {
		pairSubscribers.set(key, () => socket.emit(SocketEvent.SUBSCRIBE_PAIR, { pairId }));
	}

	const subscribe = pairSubscribers.get(key) as () => void;

	return refCountedSubscription(key, subscribe, () => {
		pairSubscribers.delete(key);
		socket.emit(SocketEvent.UNSUBSCRIBE_PAIR, { pairId });
	});
}

export function subscribeAuthorizedEvents(token: string) {
	const key = `auth:${token}`;

	if (!authorizedSubscribers.has(key)) {
		authorizedSubscribers.set(key, () =>
			socket.emit(SocketEvent.SUBSCRIBE_AUTHORIZED_EVENTS, { a: token }),
		);
	}

	const subscribe = authorizedSubscribers.get(key) as () => void;

	return refCountedSubscription(key, subscribe, () => {
		authorizedSubscribers.delete(key);
		socket.emit(SocketEvent.UNSUBSCRIBE_AUTHORIZED_EVENTS, { a: token });
	});
}

export function onPairEvents(pairIds: string[], handler: (_eventName: string) => void) {
	const ids = new Set(pairIds.map(String));

	const listeners = PAIR_PUBLIC_EVENTS.map((eventName) => {
		const listener = (payload: { pairId?: string } | undefined) => {
			if (payload?.pairId !== undefined && !ids.has(String(payload.pairId))) return;
			handler(eventName);
		};

		socket.on(eventName, listener);
		return [eventName, listener] as const;
	});

	return () => {
		listeners.forEach(([eventName, listener]) => socket.off(eventName, listener));
	};
}

export function onAuthorizedEvents(handler: (_eventName: string, _payload: unknown) => void) {
	const listeners = AUTHORIZED_EVENTS.map((eventName) => {
		const listener = (payload: unknown) => handler(eventName, payload);
		socket.on(eventName, listener);
		return [eventName, listener] as const;
	});

	return () => {
		listeners.forEach(([eventName, listener]) => socket.off(eventName, listener));
	};
}

export default socket;
