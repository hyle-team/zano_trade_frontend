import ApplyTip from '@/interfaces/common/ApplyTip';
import OrderRow from '@/interfaces/common/OrderRow';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import { getPairStats, getUserOrdersPage } from '@/utils/methods';
import socket, {
	SocketEvent,
	onAuthorizedEvents,
	onPairEvents,
	subscribePair,
} from '@/utils/socket';
import { toTrade } from '@/utils/v2/mappers';
import { V2TradePerformedEvent } from '@/utils/v2/types';
import { Store } from '@/store/store-reducer';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useContext, useEffect, useRef } from 'react';

const MAX_LIVE_TRADES = 100;

interface useSocketListenersParams {
	setUserOrders: Dispatch<SetStateAction<OrderRow[]>>;
	setApplyTips: Dispatch<SetStateAction<ApplyTip[]>>;
	setPairStats: Dispatch<SetStateAction<PairStats | null>>;
	setOrdersHistory: Dispatch<SetStateAction<PageOrderData[]>>;
	ordersHistory: PageOrderData[];
	updateOrders: () => Promise<void>;
	setTrades?: Dispatch<SetStateAction<Trade[]>>;
}

export const useSocketListeners = ({
	setUserOrders,
	setApplyTips,
	setPairStats,
	updateOrders,
	setTrades,
}: useSocketListenersParams) => {
	const { state } = useContext(Store);
	const router = useRouter();
	const pairId = typeof router.query.id === 'string' ? router.query.id : '';

	const tokenRef = useRef(state.token);
	tokenRef.current = state.token;

	const updateOrdersRef = useRef(updateOrders);
	updateOrdersRef.current = updateOrders;

	async function socketUpdateOrders() {
		if (!tokenRef.current) return;
		const result = await getUserOrdersPage(pairId, { token: tokenRef.current });

		if (result.success) {
			setUserOrders(result?.data?.orders || []);
			setApplyTips(result?.data?.applyTips || []);
		}
	}

	async function socketUpdateStats() {
		const result = await getPairStats(pairId).catch(() => null);
		if (result?.success) setPairStats(result.data);
	}

	useEffect(() => {
		if (!pairId) return undefined;

		const unsubscribe = subscribePair(pairId);

		const offPair = onPairEvents([pairId], async (eventName) => {
			await updateOrdersRef.current();
			await socketUpdateOrders();
			if (eventName === SocketEvent.TRADE_PERFORMED_PUBLIC) await socketUpdateStats();
		});

		const offAuthorized = onAuthorizedEvents(() => {
			socketUpdateOrders();
		});

		function onTrade(trade: V2TradePerformedEvent) {
			if (!setTrades || String(trade?.pairId) !== pairId) return;

			setTrades((prev) => {
				if (prev.some((t) => String(t.id) === String(trade.id))) return prev;
				return [toTrade(trade, prev[0]?.price), ...prev].slice(0, MAX_LIVE_TRADES);
			});
		}

		socket.on(SocketEvent.TRADE_PERFORMED_PUBLIC, onTrade);

		return () => {
			offPair();
			offAuthorized();
			socket.off(SocketEvent.TRADE_PERFORMED_PUBLIC, onTrade);
			unsubscribe();
		};
	}, [pairId]);
};
