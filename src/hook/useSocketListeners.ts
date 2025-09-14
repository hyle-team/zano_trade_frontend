import ApplyTip from '@/interfaces/common/ApplyTip';
import OrderRow from '@/interfaces/common/OrderRow';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { getUserOrdersPage } from '@/utils/methods';
import socket from '@/utils/socket';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useEffect } from 'react';

interface useSocketListenersParams {
	setUserOrders: Dispatch<SetStateAction<OrderRow[]>>;
	setApplyTips: Dispatch<SetStateAction<ApplyTip[]>>;
	setPairStats: Dispatch<SetStateAction<PairStats | null>>;
	setOrdersHistory: Dispatch<SetStateAction<PageOrderData[]>>;
	ordersHistory: PageOrderData[];
	updateOrders: () => Promise<void>;
}

export const useSocketListeners = ({
	setUserOrders,
	setApplyTips,
	setPairStats,
	setOrdersHistory,
	ordersHistory,
	updateOrders,
}: useSocketListenersParams) => {
	const router = useRouter();
	const pairId = typeof router.query.id === 'string' ? router.query.id : '';

	async function socketUpdateOrders() {
		const result = await getUserOrdersPage(pairId);

		if (result.success) {
			setUserOrders(result?.data?.orders || []);
			setApplyTips(result?.data?.applyTips || []);
		}
	}

	useEffect(() => {
		socket.emit('in-trading', { id: router.query.id });

		return () => {
			socket.emit('out-trading', { id: router.query.id });
		};
	}, []);

	useEffect(() => {
		socket.on('new-order', async (data) => {
			setOrdersHistory([data.orderData, ...ordersHistory]);
			await socketUpdateOrders();
		});

		socket.on('delete-order', async () => {
			await updateOrders();
			await socketUpdateOrders();
		});

		return () => {
			socket.off('new-order');
			socket.off('delete-order');
		};
	}, [ordersHistory]);

	useEffect(() => {
		function onUpdateStats({ pairStats }: { pairStats: PairStats }) {
			setPairStats(pairStats);
		}

		socket.on('update-pair-stats', onUpdateStats);

		return () => {
			socket.off('update-pair-stats', onUpdateStats);
		};
	}, []);

	useEffect(() => {
		socket.on('update-orders', async () => {
			await socketUpdateOrders();
		});

		return () => {
			socket.off('update-orders');
		};
	}, []);
};
