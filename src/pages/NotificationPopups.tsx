import { OrderDataWithPair } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { Store } from '@/store/store-reducer';
import socket, { SocketEvent } from '@/utils/socket';
import { onOrderMatchNotification } from '@/utils/v2/events';
import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/NotificationPopups.module.scss';
import OrderNotification from '@/components/default/OrderNotification/OrderNotification';
import { updateAutoClosedNotification } from '@/store/actions';

export default function NotificationPopups() {
	const { state, dispatch } = useContext(Store);

	const [notificationOrders, setNotificationOrders] = useState<OrderDataWithPair[]>([]);
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (!state.token) setNotificationOrders([]);
	}, [state.token]);

	useEffect(() => {
		function onNotify(orderData: OrderDataWithPair) {
			setNotificationOrders((prev) =>
				[orderData, ...prev.filter((e) => e.id !== orderData.id)].slice(0, 2),
			);
		}

		function onCancel(data: { orderId: string }) {
			setNotificationOrders((prev) => prev.filter((e) => String(e.id) !== data.orderId));
		}

		function onPublicCancel({ id }: { id: string }) {
			onCancel({ orderId: String(id) });
		}

		const offMatch = state.token ? onOrderMatchNotification(onNotify) : () => undefined;
		socket.on(SocketEvent.CANCEL_ORDER_PUBLIC, onPublicCancel);

		if (state.closed_notifications.length > 0) {
			for (const notificationID of state.closed_notifications) {
				onCancel({ orderId: notificationID });
			}

			updateAutoClosedNotification(dispatch, []);
		}

		return () => {
			offMatch();
			socket.off(SocketEvent.CANCEL_ORDER_PUBLIC, onPublicCancel);
		};
	}, [dispatch, state.token, state.user, notificationOrders, state.closed_notifications]);

	if (!mounted) return null;

	return createPortal(
		<div className={styles.dex__notifications_wrapper}>
			{notificationOrders.map((e, i) => (
				<OrderNotification
					setNotificationOrders={setNotificationOrders}
					key={e.id}
					order={e}
					index={i}
				/>
			))}
		</div>,
		document.body,
	);
}
