import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import EmptyMessage from '@/components/UI/EmptyMessage';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import GenericTable from '@/components/default/GenericTable';
import ActionBtn from '@/components/UI/ActionBtn';
import { getMyPairOrders } from '@/utils/methods';
import { Store } from '@/store/store-reducer';
import OrderRow from '@/interfaces/common/OrderRow';
import { useAlert } from '@/hook/useAlert';
import { tabsType } from '@/components/UI/Tabs/types';
import Tabs from '@/components/UI/Tabs';
import { useQuerySyncedTab } from '@/hook/useQuerySyncedTab';
import { useMediaQuery } from '@/hook/useMediaQuery';
import { GetUserOrdersBodyStatus } from '@/interfaces/fetch-data/get-user-orders/GetUserOrdersData';
import { UserOrdersProps } from './types';
import styles from './styles.module.scss';
import { buildOrderHistoryColumns, buildUserColumns } from './columns';
import UniversalCards from './cards/UniversalCards';
import OrderItemsModal from './components/OrderItemsModal';
import { OrderItemsKind } from './components/OrderItemsModal/types';

const UserOrders = ({
	userOrders,
	myOrdersLoading,
	handleCancelAllOrders,
	orderListRef,
	matrixAddresses,
	secondAssetUsdPrice,
	onAfter,
	onOpenMyOrders,
	pairData,
	requestedTab,
	onRequestedTabHandled,
}: UserOrdersProps) => {
	const { state } = useContext(Store);
	const loggedIn = !!state.wallet?.connected;
	const { setAlertState, setAlertSubtitle } = useAlert();
	const isSm = useMediaQuery('(max-width: 820px)');
	const isMobile = useMediaQuery('(max-width: 580px)');

	const [ordersHistory, setOrdersHistory] = useState<OrderRow[]>([]);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyLoaded, setHistoryLoaded] = useState(false);
	const [itemsModal, setItemsModal] = useState<{
		kind: OrderItemsKind;
		order: OrderRow;
	} | null>(null);
	const historyRequestIdRef = useRef(0);

	const pairId = pairData?.id ? String(pairData.id) : '';

	const tabsData: tabsType[] = useMemo(
		() => [
			{
				title: 'My Orders',
				type: 'opened',
				length: userOrders.length || undefined,
			},
			{
				title: 'History - Last 100 Items',
				type: 'history',
				length: historyLoaded ? ordersHistory.length || undefined : undefined,
			},
		],
		[userOrders.length, ordersHistory.length, historyLoaded],
	);

	const { active: ordersType, setActiveTab } = useQuerySyncedTab({
		tabs: tabsData,
		defaultType: 'opened',
		queryKey: 'tab',
	});

	useEffect(() => {
		if (!requestedTab) return;

		setActiveTab(requestedTab);
		onRequestedTabHandled?.();
	}, [requestedTab]);

	async function fetchHistory() {
		historyRequestIdRef.current += 1;
		const requestId = historyRequestIdRef.current;

		setHistoryLoading(true);

		const result = await getMyPairOrders(pairId, GetUserOrdersBodyStatus.FINISHED, {
			token: state.token,
		}).catch(() => null);

		if (requestId !== historyRequestIdRef.current) return;

		setHistoryLoading(false);

		if (!result?.success) {
			setAlertState('error');
			setAlertSubtitle('Error loading orders data');
			setTimeout(() => {
				setAlertState(null);
				setAlertSubtitle('');
			}, 2000);
			return;
		}

		setOrdersHistory(result.data);
		setHistoryLoaded(true);
	}

	useEffect(() => {
		historyRequestIdRef.current += 1;
		setOrdersHistory([]);
		setHistoryLoaded(false);
		setHistoryLoading(false);
	}, [pairId, loggedIn, state.token]);

	useEffect(() => {
		if (!loggedIn || !state.token || !pairId) return;

		if (ordersType.type === 'history') {
			fetchHistory();
			return;
		}

		onOpenMyOrders();
	}, [ordersType.type, loggedIn, state.token, pairId]);

	const firstCurrencyName = pairData?.first_currency?.name ?? '';
	const secondCurrencyName = pairData?.second_currency?.name ?? '';

	const openItems = (kind: OrderItemsKind, order: OrderRow) => setItemsModal({ kind, order });

	const columnsOpened = useMemo(
		() =>
			buildUserColumns({
				firstCurrencyName,
				secondCurrencyName,
				secondAssetUsdPrice,
				onOpenItems: openItems,
				onAfter,
			}),
		[firstCurrencyName, secondCurrencyName, secondAssetUsdPrice, onAfter],
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

	const isHistory = ordersType.type === 'history';
	const loading = isHistory ? historyLoading : myOrdersLoading;

	const renderOrders = () => {
		if (isHistory) {
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
		}

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
				onOpenItems={openItems}
				onAfter={onAfter}
			/>
		);
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

				{!loading && loggedIn && renderOrders()}

				{loading && loggedIn && <ContentPreloader className={styles.userOrders__body} />}
				{!loggedIn && <EmptyMessage text="Connect wallet to see your orders" />}
			</div>

			{itemsModal && (
				<OrderItemsModal
					key={`${itemsModal.kind}:${itemsModal.order.id}`}
					kind={itemsModal.kind}
					order={itemsModal.order}
					pairData={pairData}
					firstCurrencyName={firstCurrencyName}
					secondCurrencyName={secondCurrencyName}
					secondAssetUsdPrice={secondAssetUsdPrice}
					matrixAddresses={matrixAddresses}
					onClose={() => setItemsModal(null)}
					onAfter={onAfter}
					onCountsOutdated={onOpenMyOrders}
				/>
			)}
		</>
	);
};

export default UserOrders;
