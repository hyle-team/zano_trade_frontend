import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import { getPairStats } from '@/utils/methods';
import socket, {
	SocketEvent,
	onAuthorizedEvents,
	onPairEvents,
	onReconnect,
	subscribePair,
} from '@/utils/socket';
import { toTrade } from '@/utils/v2/mappers';
import { V2TradePerformedEvent } from '@/utils/v2/types';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useEffect, useRef } from 'react';

const MAX_LIVE_TRADES = 100;

interface useSocketListenersParams {
	setPairStats: Dispatch<SetStateAction<PairStats | null>>;
	setOrdersHistory: Dispatch<SetStateAction<PageOrderData[]>>;
	ordersHistory: PageOrderData[];
	updateOrders: () => Promise<void>;
	updateUserOrders: () => Promise<void>;
	setTrades?: Dispatch<SetStateAction<Trade[]>>;
}

export const useSocketListeners = ({
	setPairStats,
	updateOrders,
	updateUserOrders,
	setTrades,
}: useSocketListenersParams) => {
	const router = useRouter();
	const pairId = typeof router.query.id === 'string' ? router.query.id : '';

	const updateOrdersRef = useRef(updateOrders);
	updateOrdersRef.current = updateOrders;

	const updateUserOrdersRef = useRef(updateUserOrders);
	updateUserOrdersRef.current = updateUserOrders;

	async function socketUpdateStats() {
		const result = await getPairStats(pairId).catch(() => null);
		if (result?.success) setPairStats(result.data);
	}

	useEffect(() => {
		if (!pairId) return undefined;

		const unsubscribe = subscribePair(pairId);

		const offPair = onPairEvents([pairId], async (eventName) => {
			await updateOrdersRef.current();
			if (eventName === SocketEvent.TRADE_PERFORMED_PUBLIC) await socketUpdateStats();
		});

		const offAuthorized = onAuthorizedEvents(() => {
			updateUserOrdersRef.current();
		});

		function onTrade(trade: V2TradePerformedEvent) {
			if (!setTrades || String(trade?.pairId) !== pairId) return;

			setTrades((prev) => {
				if (prev.some((t) => String(t.id) === String(trade.id))) return prev;
				return [toTrade(trade, prev[0]?.price), ...prev].slice(0, MAX_LIVE_TRADES);
			});
		}

		socket.on(SocketEvent.TRADE_PERFORMED_PUBLIC, onTrade);

		const offReconnect = onReconnect(() => {
			updateOrdersRef.current();
			updateUserOrdersRef.current();
			socketUpdateStats();
		});

		return () => {
			offPair();
			offAuthorized();
			offReconnect();
			socket.off(SocketEvent.TRADE_PERFORMED_PUBLIC, onTrade);
			unsubscribe();
		};
	}, [pairId]);
};
