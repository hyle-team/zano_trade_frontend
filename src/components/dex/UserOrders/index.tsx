import { classes } from '@/utils/utils';
import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import useUpdateUser from '@/hook/useUpdateUser';
import EmptyMessage from '@/components/UI/EmptyMessage';
import styles from './styles.module.scss';
import { UserOrdersProps } from './types';
import MyOrdersRow from './components/MyOrdersRow';
import MyOrdersApplyRow from './components/MyOrdersApplyRow';

const UserOrders = ({
	userOrders,
	applyTips,
	myOrdersLoading,
	loggedIn,
	ordersType,
	setOrdersType,
	handleCancelAllOrders,
	orderListRef,
	matrixAddresses,
	secondAssetUsdPrice,
	updateOrders,
	updateUserOrders,
	fetchTrades,
	pairData,
}: UserOrdersProps) => {
	const fetchUser = useUpdateUser();
	const firstCurrencyName = pairData?.first_currency?.name || '';
	const secondCurrencyName = pairData?.second_currency?.name || '';

	return (
		<div ref={orderListRef} className={styles.userOrders}>
			<div className={styles.userOrders__header}>
				<div className={styles.userOrders__header_nav}>
					<button
						onClick={() => setOrdersType('opened')}
						className={classes(
							styles.navItem,
							ordersType === 'opened' && styles.active,
						)}
					>
						Opened orders {applyTips?.length ? <span>{applyTips?.length}</span> : ''}
					</button>

					<button
						onClick={() => setOrdersType('history')}
						className={classes(
							styles.navItem,
							ordersType === 'history' && styles.active,
						)}
					>
						Orders History
					</button>
				</div>

				<div className={styles.trading__user_cancelOrder}>
					<button
						className={styles.userOrders__header_btn}
						onClick={handleCancelAllOrders}
					>
						Cancel all orders
					</button>
				</div>
			</div>

			<div>
				<table>
					<thead>
						<tr>
							<th>Alias</th>
							<th>Price ({secondCurrencyName})</th>
							<th>Amount ({firstCurrencyName})</th>
							<th>Total ({secondCurrencyName})</th>
							<th>Offers</th>
							<th></th>
						</tr>
					</thead>
				</table>

				{!myOrdersLoading && loggedIn && !!userOrders.length && (
					<div className={`${styles.userOrders__body} orders-scroll`}>
						<table>
							<tbody className={styles.incoming}>
								{userOrders.map((e) => (
									<MyOrdersRow
										key={e.id}
										orderData={e}
										applyTips={applyTips}
										fetchUser={fetchUser}
										matrixAddresses={matrixAddresses}
										secondAssetUsdPrice={secondAssetUsdPrice}
										updateOrders={updateOrders}
										updateUserOrders={updateUserOrders}
									/>
								))}
							</tbody>
						</table>

						{!!applyTips.length && (
							<table className={styles.apply}>
								<tbody>
									{applyTips.map((e) => (
										<MyOrdersApplyRow
											key={e.id}
											pairData={pairData}
											orderData={e}
											userOrders={userOrders}
											fetchTrades={fetchTrades}
											fetchUser={fetchUser}
											matrixAddresses={matrixAddresses}
											secondAssetUsdPrice={secondAssetUsdPrice}
											updateOrders={updateOrders}
											updateUserOrders={updateUserOrders}
										/>
									))}
								</tbody>
							</table>
						)}
					</div>
				)}

				{myOrdersLoading && loggedIn && <ContentPreloader style={{ marginTop: 40 }} />}

				{!loggedIn && <EmptyMessage text="Connect wallet to see your orders" />}

				{loggedIn && !userOrders.length && !myOrdersLoading && (
					<EmptyMessage text="No orders" />
				)}
			</div>
		</div>
	);
};

export default UserOrders;
