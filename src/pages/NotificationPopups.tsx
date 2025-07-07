import { OrderDataWithPair } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { Store } from '@/store/store-reducer';
import socket from '@/utils/socket';
import { useContext, useEffect, useState } from 'react';
import styles from '@/styles/NotificationPopups.module.scss';
import OrderNotification from '@/components/default/OrderNotification/OrderNotification';
import { nanoid } from 'nanoid';
import { updateAutoClosedNotification } from '@/store/actions';

export default function NotificationPopups() {
	const { state, dispatch } = useContext(Store);

	const [notificationOrders, setNotificationOrders] = useState<OrderDataWithPair[]>([]);

	useEffect(() => {
		const checkAuthAndEmit = async () => {
			try {
				const res = await fetch('/api/check-auth', {
					method: 'POST',
					credentials: 'include',
				});

				const data = await res.json();

				if (data.success) {
					socket.emit('in-dex-notifications', {});

					return () => {
						socket.emit('out-dex-notifications', {});
					};
				}
			} catch (error) {
				console.error('Auth check failed:', error);
			}
		};

		checkAuthAndEmit();
	}, [state.user?.address]);

	useEffect(() => {
		function onNotify({ orderData }: { orderData: OrderDataWithPair }) {
			setNotificationOrders((prev) => [orderData, ...prev].slice(0, 2));
		}

		function onCancel(data: { orderId: number }) {
			console.log('cancel', data.orderId, notificationOrders);

			setNotificationOrders((prev) => {
				console.log(prev, data.orderId);

				return prev.filter((e) => parseInt(e.id, 10) !== data.orderId);
			});
		}

		socket.on('order-notification', onNotify);
		socket.on('order-notification-cancelation', onCancel);

		if (state.closed_notifications.length > 0) {
			for (const notificationID of state.closed_notifications) {
				onCancel({ orderId: notificationID });
			}

			console.log('Closed notifications:', state.closed_notifications);

			updateAutoClosedNotification(dispatch, []);
		}

		return () => {
			socket.off('order-notification', onNotify);
			socket.off('order-notification-cancelation', onCancel);
		};
	}, [dispatch, state.user, notificationOrders, state.closed_notifications]);

	return (
		<>
			<div className={styles.dex__notifications_wrapper}>
				{notificationOrders.map((e, i) => (
					<OrderNotification
						setNotificationOrders={setNotificationOrders}
						key={nanoid()}
						order={e}
						index={i}
					/>
				))}
			</div>
		</>
	);
}
