import {
	getCandles,
	getOrdersPage,
	getPair,
	getPairStats,
	getUserOrdersPage,
	getTrades,
} from '@/utils/methods';
import useUpdateUser from '@/hook/useUpdateUser';
import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import CandleRow from '@/interfaces/common/CandleRow';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import PairData from '@/interfaces/common/PairData';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import OrderRow from '@/interfaces/common/OrderRow';
import ApplyTip from '@/interfaces/common/ApplyTip';
import { useRouter } from 'next/router';
import PeriodState from '@/interfaces/states/pages/dex/trading/InputPanelItem/PeriodState';
import { Store } from '@/store/store-reducer';

interface UseTradingDataParams {
	periodsState: PeriodState;
	setCandles: Dispatch<SetStateAction<CandleRow[]>>;
	setOrdersHistory: Dispatch<SetStateAction<PageOrderData[]>>;
	setTrades: Dispatch<SetStateAction<Trade[]>>;
	setPairData: Dispatch<SetStateAction<PairData | null>>;
	setPairStats: Dispatch<SetStateAction<PairStats | null>>;
	setUserOrders: Dispatch<SetStateAction<OrderRow[]>>;
	setApplyTips: Dispatch<SetStateAction<ApplyTip[]>>;
	setMyOrdersLoading: Dispatch<SetStateAction<boolean>>;
}

export function useTradingData({
	periodsState,
	setCandles,
	setOrdersHistory,
	setTrades,
	setPairData,
	setPairStats,
	setUserOrders,
	setApplyTips,
	setMyOrdersLoading,
}: UseTradingDataParams) {
	const { state } = useContext(Store);
	const fetchUser = useUpdateUser();
	const router = useRouter();
	const isFirstLoad = useRef(true);
	const prevPeriod = useRef<string | null>(null);

	const [candlesLoaded, setCandlesLoaded] = useState(true);
	const [ordersLoading, setOrdersLoading] = useState(false);
	const [tradesLoading, setTradesLoading] = useState(false);
	const pairId = typeof router.query.id === 'string' ? router.query.id : '';
	const loggedIn = !!state.wallet?.connected;

	async function fetchCandles() {
		setCandlesLoaded(false);
		setCandles([]);
		const result = await getCandles(pairId, periodsState.code);
		if (result.success) {
			setCandles(result.data);
		} else {
			setCandles([]);
		}
		setCandlesLoaded(true);
	}

	async function updateOrders() {
		const result = await getOrdersPage(pairId);
		if (!result.success) return;
		setOrdersHistory(result?.data || []);
		setOrdersLoading(false);
	}

	async function updateUserOrders() {
		setMyOrdersLoading(true);
		const result = await getUserOrdersPage(pairId);
		await fetchUser();

		if (!result.success) return;
		setUserOrders(result?.data?.orders || []);
		setApplyTips(result?.data?.applyTips || []);
		setMyOrdersLoading(false);
	}

	async function fetchTrades() {
		// setTradesLoading(true);
		const result = await getTrades(pairId);

		if (result.success) {
			setTrades(result.data);
		}

		setTradesLoading(false);
	}

	async function fetchPairStats() {
		const result = await getPairStats(pairId);
		if (!result.success) return;
		setPairStats(result.data);
	}

	async function getPairData() {
		const result = await getPair(pairId);
		if (!result.success) {
			router.push('/404');
			return;
		}
		setPairData(result.data);
	}

	useEffect(() => {
		if (isFirstLoad.current) {
			isFirstLoad.current = false;

			setOrdersLoading(false);
			return;
		}

		fetchPairStats();
		getPairData();
		updateOrders();
	}, []);

	useEffect(() => {
		if (!prevPeriod.current) {
			prevPeriod.current = periodsState.code;
			return;
		}

		if (prevPeriod.current === periodsState.code) return;

		prevPeriod.current = periodsState.code;
		fetchCandles();
	}, [periodsState.code]);

	useEffect(() => {
		(async () => {
			if (isFirstLoad.current) {
				setTradesLoading(false);
				return;
			}

			await fetchTrades();
		})();
	}, [pairId]);

	useEffect(() => {
		if (!loggedIn) return;
		setUserOrders([]);
		updateUserOrders();
	}, [state.wallet?.connected && state.wallet?.address]);

	return {
		fetchCandles,
		updateOrders,
		updateUserOrders,
		fetchTrades,
		fetchPairStats,
		getPairData,
		candlesLoaded,
		ordersLoading,
		tradesLoading,
	};
}
