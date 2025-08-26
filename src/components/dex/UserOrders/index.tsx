import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import useUpdateUser from '@/hook/useUpdateUser';
import EmptyMessage from '@/components/UI/EmptyMessage';
import { useContext, useEffect, useMemo, useState } from 'react';
import GenericTable from '@/components/default/GenericTable';
import ActionBtn from '@/components/UI/ActionBtn';
import { getUserOrders, getUserPendings } from '@/utils/methods';
import UserPendingType from '@/interfaces/common/UserPendingType';
import { Store } from '@/store/store-reducer';
import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';
import { useAlert } from '@/hook/useAlert';
import Alert from '@/components/UI/Alert/Alert';
import { tabsType } from '@/components/UI/Tabs/types';
import Tabs from '@/components/UI/Tabs';
import { createOrderSorter } from '@/utils/utils';
import ApplyTip from '@/interfaces/common/ApplyTip';
import { useQuerySyncedTab } from '@/hook/useQuerySyncedTab';
import { UserOrdersProps } from './types';
import styles from './styles.module.scss';
import {
	buildApplyTipsColumns,
	buildMyRequestsColumns,
	buildOrderHistoryColumns,
	buildUserColumns,
} from './columns';

const UserOrders = ({
	userOrders,
	applyTips,
	myOrdersLoading,
	handleCancelAllOrders,
	orderListRef,
	matrixAddresses,
	secondAssetUsdPrice,
	onAfter,
	pairData,
}: UserOrdersProps) => {
	const { state } = useContext(Store);
	const loggedIn = !!state.wallet?.connected;
	const { setAlertState, setAlertSubtitle, alertState, alertSubtitle } = useAlert();

	const fetchUser = useUpdateUser();
	const suitables = applyTips.filter((s) => !s.transaction);
	const offers = applyTips.filter((s) => s.transaction);
	const [userRequests, setUserRequests] = useState<UserPendingType[]>([]);
	const [ordersHistory, setOrdersHistory] = useState<UserOrderData[]>([]);

	const tabsData: tabsType[] = useMemo(
		() => [
			{
				title: 'Open Orders',
				type: 'opened',
				length: userOrders.length,
			},
			{
				title: 'Suitable',
				type: 'suitable',
				length: suitables.length,
			},
			{
				title: 'My requests',
				type: 'requests',
				length: userRequests.length,
			},
			{
				title: 'Offers',
				type: 'offers',
				length: offers.length,
			},
			{
				title: 'Order history',
				type: 'history',
				length: ordersHistory.length,
			},
		],
		[
			offers.length,
			userOrders.length,
			suitables.length,
			userRequests.length,
			ordersHistory.length,
		],
	);

	const { active: ordersType, setActiveTab } = useQuerySyncedTab({
		tabs: tabsData,
		defaultType: 'opened',
		queryKey: 'tab',
	});

	useEffect(() => {
		if (!loggedIn) return;

		(async () => {
			const requestsData = await getUserPendings();

			if (requestsData.success) {
				setUserRequests(requestsData.data);
			}
		})();

		(async () => {
			const result = await getUserOrders();

			if (!result.success) {
				setAlertState('error');
				setAlertSubtitle('Error loading orders data');
				await new Promise((resolve) => setTimeout(resolve, 2000));
				setAlertState(null);
				setAlertSubtitle('');
				return;
			}

			const filteredOrdersHistory = result.data
				.filter((s) => s.pair_id === pairData?.id)
				.filter((s) => s.status === 'finished');

			fetchUser();

			setOrdersHistory(filteredOrdersHistory);
		})();
	}, [userOrders, applyTips]);

	const firstCurrencyName = pairData?.first_currency?.name ?? '';
	const secondCurrencyName = pairData?.second_currency?.name ?? '';

	const offersCountByOrderId = useMemo(() => {
		const map = new Map<string, number>();
		for (const tip of applyTips) {
			const key = String(tip.connected_order_id);
			map.set(key, (map.get(key) ?? 0) + 1);
		}
		return map;
	}, [applyTips]);

	const columnsOpened = useMemo(
		() =>
			buildUserColumns({
				firstCurrencyName,
				secondCurrencyName,
				secondAssetUsdPrice,
				offersCountByOrderId,
				onAfter,
			}),
		[userOrders, applyTips, onAfter],
	);

	const columnsSuitables = useMemo(
		() =>
			buildApplyTipsColumns({
				type: 'suitables',
				firstCurrencyName,
				secondCurrencyName,
				matrixAddresses,
				secondAssetUsdPrice,
				userOrders,
				pairData,
				onAfter,
			}),
		[
			firstCurrencyName,
			secondCurrencyName,
			matrixAddresses,
			secondAssetUsdPrice,
			userOrders,
			pairData,
			onAfter,
		],
	);

	const columnsMyRequests = useMemo(
		() =>
			buildMyRequestsColumns({
				firstCurrencyName,
				secondCurrencyName,
				matrixAddresses,
				onAfter,
			}),
		[firstCurrencyName, secondCurrencyName, onAfter, matrixAddresses],
	);

	const columnsOffers = useMemo(
		() =>
			buildApplyTipsColumns({
				type: 'offers',
				firstCurrencyName,
				secondCurrencyName,
				matrixAddresses,
				secondAssetUsdPrice,
				userOrders,
				pairData,
				onAfter,
			}),
		[
			firstCurrencyName,
			secondCurrencyName,
			matrixAddresses,
			secondAssetUsdPrice,
			userOrders,
			pairData,
			onAfter,
		],
	);

	const columnsOrderHistory = useMemo(
		() =>
			buildOrderHistoryColumns({
				firstCurrencyName,
				secondCurrencyName,
				secondAssetUsdPrice,
			}),
		[firstCurrencyName, secondCurrencyName, secondAssetUsdPrice],
	);

	const sortedSuitables = createOrderSorter<ApplyTip>({
		getPrice: (e) => e.price,
		getSide: (e) => e.type,
	});

	const renderTable = () => {
		switch (ordersType.type) {
			case 'opened':
				return (
					<GenericTable
						className={styles.userOrders__body}
						columns={columnsOpened}
						data={userOrders}
						getRowKey={(r) => r.id}
						emptyMessage="No orders"
					/>
				);
			case 'suitable':
				return (
					<GenericTable
						className={styles.userOrders__body}
						columns={columnsSuitables}
						data={suitables.sort(sortedSuitables)}
						getRowKey={(r) => r.id}
						emptyMessage="No suitables"
					/>
				);
			case 'requests':
				return (
					<GenericTable
						className={styles.userOrders__body}
						columns={columnsMyRequests}
						data={userRequests}
						getRowKey={(r) => r.id}
						emptyMessage="No requests"
					/>
				);
			case 'offers':
				return (
					<GenericTable
						className={styles.userOrders__body}
						columns={columnsOffers}
						data={offers}
						getRowKey={(r) => r.id}
						emptyMessage="No offers"
					/>
				);
			case 'history':
				return (
					<GenericTable
						className={styles.userOrders__body}
						columns={columnsOrderHistory}
						data={ordersHistory}
						getRowKey={(r) => r.id}
						emptyMessage="No data"
					/>
				);
			default:
				return null;
		}
	};

	return (
		<>
			<div ref={orderListRef} className={styles.userOrders}>
				<div className={styles.userOrders__header}>
					<Tabs
						data={tabsData}
						value={ordersType}
						setValue={(t) => setActiveTab(t.type)}
					/>

					{ordersType?.type === 'opened' && userOrders.length > 0 && (
						<ActionBtn
							className={styles.userOrders__header_btn}
							onClick={handleCancelAllOrders}
						>
							Cancel all
						</ActionBtn>
					)}
				</div>

				{!myOrdersLoading && loggedIn && renderTable()}

				{myOrdersLoading && loggedIn && <ContentPreloader style={{ marginTop: 40 }} />}
				{!loggedIn && <EmptyMessage text="Connect wallet to see your orders" />}
			</div>

			{alertState && (
				<Alert
					type={alertState}
					subtitle={alertSubtitle || ''}
					close={() => setAlertState(null)}
				/>
			)}
		</>
	);
};

export default UserOrders;
