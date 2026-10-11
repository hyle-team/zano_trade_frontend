import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import socket from '@/utils/socket';
import { Store } from '@/store/store-reducer';
import {
	getOrdersPage,
	getPair,
	getPairStats,
	getUserOrdersPage,
	getUserPendings,
} from '@/utils/methods';
import PairData from '@/interfaces/common/PairData';
import OrderRow from '@/interfaces/common/OrderRow';
import ApplyTip from '@/interfaces/common/ApplyTip';
import UserPendingType from '@/interfaces/common/UserPendingType';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';

const USER_DATA_POLL_INTERVAL = 15e3;

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

		const [userPage, pendingRes] = await Promise.all([
			getUserOrdersPage(id, { token }).catch(() => null),
			getUserPendings({ token }).catch(() => null),
		]);

		if (pairIdRef.current !== id) return;

		if (userPage?.success) {
			setUserOrders(userPage.data?.orders || []);
			setApplyTips(userPage.data?.applyTips || []);
		}

		if (pendingRes?.success) {
			setPendings(pendingRes.data || []);
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
		setUserDataLoaded(false);

		if (!loggedIn || !pairId) return;

		refreshUserData();

		const interval = setInterval(refreshUserData, USER_DATA_POLL_INTERVAL);

		return () => clearInterval(interval);
	}, [pairId, loggedIn, state.wallet?.address]);

	useEffect(() => {
		if (!pairId) return;

		socket.emit('in-trading', { id: pairId });

		const onBookChanged = () => {
			refreshAll();
		};

		const onStats = ({ pairStats: stats }: { pairStats: PairStats }) => {
			setPairStats(stats);
		};

		socket.on('new-order', onBookChanged);
		socket.on('delete-order', onBookChanged);
		socket.on('update-orders', onBookChanged);
		socket.on('update-pair-stats', onStats);

		return () => {
			socket.emit('out-trading', { id: pairId });
			socket.off('new-order', onBookChanged);
			socket.off('delete-order', onBookChanged);
			socket.off('update-orders', onBookChanged);
			socket.off('update-pair-stats', onStats);
		};
	}, [pairId, refreshAll]);

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
