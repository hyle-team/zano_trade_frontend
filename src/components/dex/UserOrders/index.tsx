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
import { countByKeyRecord, createOrderSorter } from '@/utils/utils';
import ApplyTip from '@/interfaces/common/ApplyTip';
import { useQuerySyncedTab } from '@/hook/useQuerySyncedTab';
import { useMediaQuery } from '@/hook/useMediaQuery';
import { UserOrdersProps } from './types';
import styles from './styles.module.scss';
import {
	buildApplyTipsColumns,
	buildMyRequestsColumns,
	buildOrderHistoryColumns,
	buildUserColumns,
} from './columns';
import OrderGroupHeader from './components/OrderGroupHeader';
import UniversalCards from './cards/UniversalCards';

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
	const isSm = useMediaQuery('(max-width: 820px)');
	const isMobile = useMediaQuery('(max-width: 580px)');

	const fetchUser = useUpdateUser();
	const matches = applyTips.filter((s) => !s.transaction);
	const offers = applyTips.filter((s) => s.transaction);
	const [userRequests, setUserRequests] = useState<UserPendingType[]>([]);
	const [ordersHistory, setOrdersHistory] = useState<UserOrderData[]>([]);

	const tabsData: tabsType[] = useMemo(
		() => [
			{
				title: 'My Orders',
				type: 'opened',
				length: userOrders.length,
			},
			{
				title: 'Matches',
				type: 'matches',
				length: matches.length,
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
				title: 'History',
				type: 'history',
				length: ordersHistory.length,
			},
		],
		[
			offers.length,
			userOrders.length,
			matches.length,
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

	const matchesCountByOrderId = useMemo(() => {
		return countByKeyRecord(matches, (tip) => tip.connected_order_id);
	}, [matches]);
	const requestsCountByOrderId = useMemo(() => {
		return countByKeyRecord(userRequests, (tip) =>
			tip.creator === 'sell' ? tip.sell_order_id : tip.buy_order_id,
		);
	}, [userRequests]);
	const offersCountByOrderId = useMemo(() => {
		return countByKeyRecord(offers, (tip) => tip.connected_order_id);
	}, [offers]);

	const columnsOpened = useMemo(
		() =>
			buildUserColumns({
				firstCurrencyName,
				secondCurrencyName,
				secondAssetUsdPrice,
				matchesCountByOrderId,
				requestsCountByOrderId,
				offersCountByOrderId,
				onAfter,
			}),
		[
			firstCurrencyName,
			secondCurrencyName,
			secondAssetUsdPrice,
			matchesCountByOrderId,
			offersCountByOrderId,
			requestsCountByOrderId,
			onAfter,
		],
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

	const sortMatches = createOrderSorter<ApplyTip>({
		getPrice: (e) => e.price,
		getSide: (e) => e.type,
	});

	const renderOrders = () => {
		switch (ordersType.type) {
			case 'opened':
				return !isSm ? (
					<GenericTable
						className={styles.userOrders__body}
						columns={columnsOpened}
						data={userOrders}
						getRowKey={(r) => r.id}
						emptyMessage="No orders"
					/>
				) : (
					<UniversalCards
						type="orders"
						data={userOrders}
						firstCurrencyName={firstCurrencyName}
						secondCurrencyName={secondCurrencyName}
						secondAssetUsdPrice={secondAssetUsdPrice}
						matchesCountByOrderId={matchesCountByOrderId}
						offersCountByOrderId={offersCountByOrderId}
						requestsCountByOrderId={requestsCountByOrderId}
						onAfter={onAfter}
					/>
				);
			case 'matches':
				return !isSm ? (
					<GenericTable
						className={styles.userOrders__body}
						columns={columnsSuitables}
						data={matches.sort(sortMatches)}
						getRowKey={(r) => r.id}
						emptyMessage="No suitables"
						groupBy={(r) => r.connected_order_id}
						renderGroupHeader={({ groupKey }) => (
							<OrderGroupHeader
								order={userOrders.find((o) => String(o.id) === String(groupKey))}
								firstCurrencyName={firstCurrencyName}
								secondCurrencyName={secondCurrencyName}
							/>
						)}
					/>
				) : (
					<UniversalCards
						type="matches"
						data={matches.sort(sortMatches)}
						firstCurrencyName={firstCurrencyName}
						secondCurrencyName={secondCurrencyName}
						secondAssetUsdPrice={secondAssetUsdPrice}
						onAfter={onAfter}
						matrixAddresses={matrixAddresses}
						pairData={pairData}
						userOrders={userOrders}
					/>
				);
			case 'requests':
				return !isSm ? (
					<GenericTable
						className={styles.userOrders__body}
						columns={columnsMyRequests}
						data={userRequests}
						getRowKey={(r) => r.id}
						emptyMessage="No requests"
						groupBy={(r) => (r.creator === 'sell' ? r.sell_order_id : r.buy_order_id)}
						renderGroupHeader={({ groupKey }) => (
							<OrderGroupHeader
								order={userOrders.find((o) => String(o.id) === String(groupKey))}
								firstCurrencyName={firstCurrencyName}
								secondCurrencyName={secondCurrencyName}
							/>
						)}
					/>
				) : (
					<UniversalCards
						type="requests"
						data={userRequests}
						firstCurrencyName={firstCurrencyName}
						secondCurrencyName={secondCurrencyName}
						secondAssetUsdPrice={secondAssetUsdPrice}
						onAfter={onAfter}
						matrixAddresses={matrixAddresses}
					/>
				);
			case 'offers':
				return !isSm ? (
					<GenericTable
						className={styles.userOrders__body}
						columns={columnsOffers}
						data={offers}
						getRowKey={(r) => r.id}
						emptyMessage="No offers"
						groupBy={(r) => r.connected_order_id}
						renderGroupHeader={({ groupKey }) => (
							<OrderGroupHeader
								order={userOrders.find((o) => String(o.id) === String(groupKey))}
								firstCurrencyName={firstCurrencyName}
								secondCurrencyName={secondCurrencyName}
							/>
						)}
					/>
				) : (
					<UniversalCards
						type="offers"
						data={offers}
						firstCurrencyName={firstCurrencyName}
						secondCurrencyName={secondCurrencyName}
						secondAssetUsdPrice={secondAssetUsdPrice}
						onAfter={onAfter}
						matrixAddresses={matrixAddresses}
						pairData={pairData}
						userOrders={userOrders}
					/>
				);
			case 'history':
				return !isSm ? (
					<GenericTable
						className={styles.userOrders__body}
						columns={columnsOrderHistory}
						data={ordersHistory}
						getRowKey={(r) => r.id}
						emptyMessage="No data"
					/>
				) : (
					<UniversalCards
						type="history"
						data={ordersHistory}
						firstCurrencyName={firstCurrencyName}
						secondCurrencyName={secondCurrencyName}
						secondAssetUsdPrice={secondAssetUsdPrice}
						onAfter={onAfter}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<>
			<div data-tour="user-orders" ref={orderListRef} className={styles.userOrders}>
				<div className={styles.userOrders__header}>
					<Tabs
						type={isMobile ? 'button' : 'tab'}
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

				{!myOrdersLoading && loggedIn && renderOrders()}

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
