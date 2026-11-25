import {
	getCandles,
	getMyPairOrders,
	getOrdersPage,
	getPair,
	getPairStats,
	getTrades,
} from '@/utils/methods';
import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import CandleRow from '@/interfaces/common/CandleRow';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import PairData from '@/interfaces/common/PairData';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import OrderRow from '@/interfaces/common/OrderRow';
import { GetUserOrdersBodyStatus } from '@/interfaces/fetch-data/get-user-orders/GetUserOrdersData';
import { useRouter } from 'next/router';
import PeriodState from '@/interfaces/states/pages/dex/trading/InputPanelItem/PeriodState';
import { Store } from '@/store/store-reducer';

const MIN_CANDLES_LOADING_MS = 700;

interface UseTradingDataParams {
	periodsState: PeriodState;
	setCandles: Dispatch<SetStateAction<CandleRow[]>>;
	setOrdersHistory: Dispatch<SetStateAction<PageOrderData[]>>;
	setTrades: Dispatch<SetStateAction<Trade[]>>;
	setPairData: Dispatch<SetStateAction<PairData | null>>;
	setPairStats: Dispatch<SetStateAction<PairStats | null>>;
	setUserOrders: Dispatch<SetStateAction<OrderRow[]>>;
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
	setMyOrdersLoading,
}: UseTradingDataParams) {
	const { state } = useContext(Store);
	const router = useRouter();
	const isFirstLoad = useRef(true);
	const prevPeriod = useRef<string | null>(null);

	const [candlesLoaded, setCandlesLoaded] = useState(true);
	const candlesRequestId = useRef(0);
	const [ordersLoading, setOrdersLoading] = useState(false);
	const [tradesLoading, setTradesLoading] = useState(false);
	const pairId = typeof router.query.id === 'string' ? router.query.id : '';
	const userOrdersRequestId = useRef(0);

	async function fetchCandles() {
		candlesRequestId.current += 1;
		const requestId = candlesRequestId.current;

		setCandlesLoaded(false);
		setCandles([]);

		const [result] = await Promise.all([
			getCandles(pairId, periodsState.code).catch(() => null),
			new Promise((resolve) => setTimeout(resolve, MIN_CANDLES_LOADING_MS)),
		]);

		if (requestId !== candlesRequestId.current) return;

		setCandles(result?.success ? result.data : []);
		setCandlesLoaded(true);
	}

	async function updateOrders() {
		const result = await getOrdersPage(pairId);
		if (!result.success) return;
		setOrdersHistory(result?.data || []);
		setOrdersLoading(false);
	}

	async function updateUserOrders() {
		if (!state.token) return;

		userOrdersRequestId.current += 1;
		const requestId = userOrdersRequestId.current;

		setMyOrdersLoading(true);

		const result = await getMyPairOrders(pairId, GetUserOrdersBodyStatus.ACTIVE, {
			token: state.token,
		}).catch(() => null);

		if (requestId !== userOrdersRequestId.current) return;

		if (result?.success) setUserOrders(result.data);
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
