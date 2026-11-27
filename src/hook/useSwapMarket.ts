import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
	SocketEvent,
	onAuthorizedEvents,
	onPairEvents,
	onReconnect,
	subscribePair,
} from '@/utils/socket';
import { Store } from '@/store/store-reducer';
import { getMyPairSwapState, getOrdersPage, getPair, getPairStats } from '@/utils/methods';
import { filterValidSwapProposals } from '@/utils/swapProposalValidation';
import PairData from '@/interfaces/common/PairData';
import OrderRow from '@/interfaces/common/OrderRow';
import ApplyTip from '@/interfaces/common/ApplyTip';
import UserPendingType from '@/interfaces/common/UserPendingType';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';

interface UseSwapMarketParams {
	pairId: string | null;
	initialPair?: PairData | null;
	initialStats?: PairStats | null;
	initialOrderBook?: PageOrderData[];
}

export function useSwapMarket({
	pairId,
	initialPair = null,
	initialStats = null,
	initialOrderBook = [],
}: UseSwapMarketParams) {
	const { state } = useContext(Store);
	const loggedIn = !!state.wallet?.connected && !!state.token;

	const [pairData, setPairData] = useState<PairData | null>(initialPair);
	const [pairStats, setPairStats] = useState<PairStats | null>(initialStats);
	const [orderBook, setOrderBook] = useState<PageOrderData[]>(initialOrderBook);
	const [userOrders, setUserOrders] = useState<OrderRow[]>([]);
	const [applyTips, setApplyTips] = useState<ApplyTip[]>([]);
	const [pendings, setPendings] = useState<UserPendingType[]>([]);
	const [pairLoading, setPairLoading] = useState(false);
	const [userDataLoaded, setUserDataLoaded] = useState(false);

	const pairIdRef = useRef(pairId);
	pairIdRef.current = pairId;

	const tokenRef = useRef(state.token);
	tokenRef.current = state.token;

	const refreshOrderBook = useCallback(async () => {
		const id = pairIdRef.current;
		if (!id) return;

		const result = await getOrdersPage(id).catch(() => null);
		if (!result?.success || pairIdRef.current !== id) return;

		setOrderBook(result.data || []);
	}, []);

	const refreshUserData = useCallback(async () => {
		const id = pairIdRef.current;
		const token = tokenRef.current;
		if (!id || !token) return;

		const result = await getMyPairSwapState(id, { token }).catch(() => null);
		if (pairIdRef.current !== id) return;

		if (result?.success) {
			const validTips = await filterValidSwapProposals(
				result.data.applyTips,
				result.data.assetIds,
			);

			if (pairIdRef.current !== id) return;

			setUserOrders(result.data.orders);
			setApplyTips(validTips);
			setPendings(result.data.pendings);
		}

		setUserDataLoaded(true);
	}, []);

	const refreshAll = useCallback(async () => {
		await Promise.all([refreshOrderBook(), refreshUserData()]);
	}, [refreshOrderBook, refreshUserData]);

	const loadedPairIdRef = useRef<string | null>(initialPair ? String(initialPair.id) : null);

	useEffect(() => {
		if (!pairId || loadedPairIdRef.current === String(pairId)) return;
		loadedPairIdRef.current = String(pairId);

		let cancelled = false;
		let done = false;

		(async () => {
			setPairLoading(true);

			const [pairRes, statsRes, bookRes] = await Promise.all([
				getPair(pairId).catch(() => null),
				getPairStats(pairId).catch(() => null),
				getOrdersPage(pairId).catch(() => null),
			]);

			if (cancelled) return;

			setPairData(pairRes?.success ? pairRes.data : null);
			setPairStats(statsRes?.success ? statsRes.data : null);
			setOrderBook(bookRes?.success ? bookRes.data : []);
			setPairLoading(false);
			done = true;
		})();

		return () => {
			cancelled = true;
			if (!done) loadedPairIdRef.current = null;
		};
	}, [pairId]);

	useEffect(() => {
		setUserOrders([]);
		setApplyTips([]);
		setPendings([]);
		setUserDataLoaded(false);

		if (!loggedIn || !pairId) return;

		refreshUserData();
	}, [pairId, loggedIn, state.wallet?.address]);

	const refreshStats = useCallback(async () => {
		const id = pairIdRef.current;
		if (!id) return;
		const result = await getPairStats(id).catch(() => null);
		if (!result?.success || pairIdRef.current !== id) return;
		setPairStats(result.data);
	}, []);

	useEffect(() => {
		if (!pairId) return;

		const unsubscribe = subscribePair(String(pairId));

		const offPair = onPairEvents([String(pairId)], (eventName) => {
			refreshOrderBook();
			if (eventName === SocketEvent.TRADE_PERFORMED_PUBLIC) refreshStats();
		});

		const offAuthorized = onAuthorizedEvents(() => {
			refreshUserData();
		});

		const offReconnect = onReconnect(() => {
			refreshOrderBook();
			refreshStats();
			refreshUserData();
		});

		return () => {
			offPair();
			offAuthorized();
			offReconnect();
			unsubscribe();
		};
	}, [pairId, refreshOrderBook, refreshStats, refreshUserData]);

	return {
		pairData,
		pairStats,
		orderBook,
		userOrders,
		applyTips,
		pendings,
		pairLoading,
		userDataLoaded,
		refreshAll,
		refreshUserData,
		refreshOrderBook,
	};
}
