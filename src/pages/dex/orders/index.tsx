import styles from '@/styles/Orders.module.scss';
import Header from '@/components/default/Header/Header';
import PageTitle from '@/components/default/PageTitle/PageTitle';
import HorizontalSelect from '@/components/UI/HorizontalSelect/HorizontalSelect';
import { useEffect, useState } from 'react';
import Dropdown from '@/components/UI/Dropdown/Dropdown';
import DateRangeSelector from '@/components/UI/DateRangeSelector/DateRangeSelector';
import Button from '@/components/UI/Button/Button';
import * as fetchMethods from '@/utils/methods';
import Alert from '@/components/UI/Alert/Alert';
import AlertType from '@/interfaces/common/AlertType';
import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';
import PairValue from '@/interfaces/props/pages/dex/orders/PairValue';
import DateState from '@/interfaces/common/DateState';
import useUpdateUser from '@/hook/useUpdateUser';
import { Footer } from '@/zano_ui/src';
import {
	GetUserOrdersBodyStatus,
	GetUserOrdersBodyType,
} from '@/interfaces/fetch-data/get-user-orders/GetUserOrdersData';
import Decimal from 'decimal.js';
import { useInView } from 'react-intersection-observer';
import Preloader from '@/components/UI/Preloader/Preloader';
import { CancelAllBodyOrderType } from '@/interfaces/fetch-data/cancel-all-orders/CancelAllData';
import OrdersTable from './OrdersTable/OrdersTable';

const ORDERS_PER_PAGE = 10;

function Orders() {
	const fetchUser = useUpdateUser();

	const ordersCategories = [
		{
			name: 'Active orders',
			code: 'active-orders',
		},
		{
			name: 'Finished',
			code: 'history',
		},
	];

	const buySellValues = [
		{
			name: 'Buy & Sell',
		},
		{
			name: 'Buy',
		},
		{
			name: 'Sell',
		},
	];

	const [initialized, setInitialized] = useState(false);

	const [pairsValues, setPairsValues] = useState<PairValue[]>([{ name: 'All pairs', code: '' }]);

	const [pairDropdownValue, setPairDropdownState] = useState(pairsValues[0]);

	const [buyDropdownValue, setBuyDropdownState] = useState(buySellValues[0]);

	const [categoryState, setCategoryState] = useState(ordersCategories[0]);

	const [alertState, setAlertState] = useState<AlertType>(null);

	const [alertSubtitle, setAlertSubtitle] = useState<string>('');

	const [dateRange, setDateRange] = useState<DateState>({
		first: null,
		last: null,
	});

	const [orders, setOrders] = useState<UserOrderData[]>([]);
	const [lastOrderOffset, setLastOrderOffset] = useState(0);
	const [totalOrdersCount, setTotalOrdersCount] = useState<number | undefined>(undefined);
	const [orderPageLoading, setOrderPageLoading] = useState(false);

	const isFinishedCategory = categoryState.code === 'history';

	function deriveGetUserOrdersFiltersFromState() {
		const status =
			categoryState.code === 'active-orders'
				? GetUserOrdersBodyStatus.ACTIVE
				: GetUserOrdersBodyStatus.FINISHED;

		const type = (() => {
			if (buyDropdownValue.name === 'Buy & Sell') {
				return undefined;
			}

			return buyDropdownValue.name === 'Buy'
				? GetUserOrdersBodyType.BUY
				: GetUserOrdersBodyType.SELL;
		})();

		const pairId =
			pairDropdownValue.code === ''
				? undefined
				: new Decimal(pairDropdownValue.code).toNumber();

		const date = (() => {
			if (!dateRange.first || !dateRange.last) return undefined;

			const firstDate = new Date(dateRange.first);
			const lastDate = new Date(dateRange.last);

			firstDate.setHours(0, 0, 0, 0);
			lastDate.setHours(23, 59, 59, 999);

			return {
				from: firstDate.getTime(),
				to: lastDate.getTime(),
			};
		})();

		return {
			status,
			type,
			pairId,
			date,
		};
	}

	function deriveCancelAllOrdersFiltersFromState() {
		const type = (() => {
			if (buyDropdownValue.name === 'Buy & Sell') {
				return undefined;
			}

			return buyDropdownValue.name === 'Buy'
				? CancelAllBodyOrderType.BUY
				: CancelAllBodyOrderType.SELL;
		})();

		const pairId =
			pairDropdownValue.code === ''
				? undefined
				: new Decimal(pairDropdownValue.code).toNumber();

		const date = (() => {
			if (!dateRange.first || !dateRange.last) return undefined;

			const firstDate = new Date(dateRange.first);
			const lastDate = new Date(dateRange.last);

			firstDate.setHours(0, 0, 0, 0);
			lastDate.setHours(23, 59, 59, 999);

			return {
				from: firstDate.getTime(),
				to: lastDate.getTime(),
			};
		})();

		return {
			type,
			pairId,
			date,
		};
	}

	async function addNewOrdersPage() {
		const { status, type, pairId, date } = deriveGetUserOrdersFiltersFromState();

		const getUserOrdersRes = await fetchMethods.getUserOrders({
			limit: ORDERS_PER_PAGE,
			offset: lastOrderOffset,
			filterInfo: {
				status,
				type,
				pairId,
				date,
			},
		});

		if (!getUserOrdersRes.success) {
			throw new Error('Error fetching user orders');
		}

		const newOrders = getUserOrdersRes.data;
		const newOrdersAmount = newOrders.length;

		setOrders((prev) => [...prev, ...newOrders]);
		setLastOrderOffset((prev) => prev + newOrdersAmount);
		setTotalOrdersCount(getUserOrdersRes.totalItemsCount);
	}

	const { ref: inViewRef } = useInView({
		threshold: 0,
		onChange: async (inView) => {
			if (!inView || !initialized) {
				return;
			}

			if (totalOrdersCount !== undefined && lastOrderOffset >= totalOrdersCount) {
				return;
			}

			if (orderPageLoading) {
				return;
			}

			setOrderPageLoading(true);

			try {
				await addNewOrdersPage();
			} catch (error) {
				console.error('Error fetching new orders page:', error);

				setAlertState('error');
				setAlertSubtitle('Error loading more orders');

				await new Promise((resolve) => setTimeout(resolve, 2000));

				setAlertState(null);
				setAlertSubtitle('');
			} finally {
				setOrderPageLoading(false);
			}
		},
	});

	async function initPairsDropdown() {
		try {
			const getUserOrdersAllPairsRes = await fetchMethods.getUserOrdersAllPairs();

			if (!getUserOrdersAllPairsRes.success) {
				throw new Error('Error fetching pairs for orders');
			}

			const ordersPairs = getUserOrdersAllPairsRes.data;

			const statePairs = ordersPairs.map((e) => ({
				name: `${e.firstCurrency.ticker}/${e.secondCurrency.ticker}`,
				code: new Decimal(e.id).toFixed(),
			}));

			setPairsValues([{ name: 'All pairs', code: '' }, ...statePairs]);
		} catch (error) {
			console.error('Error while initPairsDropdown:', error);
		}
	}

	async function initOrders() {
		const { status, type, pairId, date } = deriveGetUserOrdersFiltersFromState();

		const getUserOrdersRes = await fetchMethods.getUserOrders({
			limit: ORDERS_PER_PAGE,
			offset: 0,
			filterInfo: {
				status,
				type,
				pairId,
				date,
			},
		});

		if (!getUserOrdersRes.success) {
			throw new Error('Error fetching user orders');
		}

		const newOrders = getUserOrdersRes.data;
		const newOrdersAmount = newOrders.length;

		setOrders(newOrders);
		setLastOrderOffset(newOrdersAmount);
		setTotalOrdersCount(getUserOrdersRes.totalItemsCount);

		return newOrders;
	}

	async function initialize() {
		try {
			setAlertState('loading');
			setAlertSubtitle('Loading orders data...');

			setOrders([]);
			setLastOrderOffset(0);
			setTotalOrdersCount(undefined);

			// Simulate loading time
			await new Promise((resolve) => setTimeout(resolve, 1000));

			await fetchUser();

			await initPairsDropdown();

			await initOrders();

			setInitialized(true);
			setAlertState(null);
			setAlertSubtitle('');
		} catch (error) {
			console.error('Error during initialization:', error);

			setAlertState('error');
			setAlertSubtitle('Error loading orders data');
			await new Promise((resolve) => setTimeout(resolve, 2000));
			setAlertState(null);
			setAlertSubtitle('');
		}
	}

	useEffect(() => {
		async function onFilterChange() {
			if (!initialized) {
				return;
			}

			await initialize();
		}

		onFilterChange();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [buyDropdownValue, pairDropdownValue, dateRange, categoryState]);

	useEffect(() => {
		initialize();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function deleteOrder(orderId: string) {
		try {
			setAlertState('loading');
			setAlertSubtitle('Canceling order...');

			// Simulate loading time
			await new Promise((resolve) => setTimeout(resolve, 500));

			const result = await fetchMethods.cancelOrder(orderId);

			if (!result.success) {
				throw new Error('ERROR_CANCELING_ORDER');
			}

			setAlertState('success');
			setAlertSubtitle('Order canceled');

			setTimeout(() => {
				setAlertState(null);
				setAlertSubtitle('');
			}, 2000);

			setOrders((prev) => prev.filter((e) => e.id !== orderId));
			setLastOrderOffset((prev) => Math.max(prev - 1, 0));
			setTotalOrdersCount((prev) => (prev !== undefined ? prev - 1 : prev));
		} catch (error) {
			console.error('Error canceling order:', error);

			setAlertState('error');
			setAlertSubtitle('Error canceling order');

			setTimeout(() => {
				setAlertState(null);
				setAlertSubtitle('');
			}, 2000);
		}
	}

	async function cancelAllOrders() {
		try {
			setAlertState('loading');
			setAlertSubtitle('Canceling all orders...');

			// Simulate loading time
			await new Promise((resolve) => setTimeout(resolve, 500));

			const { type, pairId, date } = deriveCancelAllOrdersFiltersFromState();

			const cancelAllRes = await fetchMethods.cancelAllOrders({
				filterInfo: {
					type,
					pairId,
					date,
				},
			});

			if (!cancelAllRes.success) {
				throw new Error('Error canceling all orders');
			}

			await initialize();
		} catch (error) {
			console.error('Error canceling all orders:', error);

			setAlertState('error');
			setAlertSubtitle('Error canceling all orders');

			setTimeout(() => {
				setAlertState(null);
				setAlertSubtitle('');
			}, 2000);
		}
	}

	return (
		<>
			<Header />
			<main className={styles.main}>
				<PageTitle>
					<div className={styles.orders__title}>
						<h1>My Trade Orders</h1>
						<p>Check all the offers you have</p>
					</div>
				</PageTitle>
				<div className={styles.orders__content}>
					<div className={styles.orders__nav}>
						<HorizontalSelect
							body={ordersCategories}
							value={categoryState}
							setValue={setCategoryState}
							isTab
						/>

						<div className={styles.orders__filters_wrapper}>
							<div className={styles.orders__filters}>
								<Dropdown
									maxItems={5}
									className={styles.orders__pair__filter}
									selfContained
									withSearch
									value={pairDropdownValue || {}}
									setValue={(e) => {
										setPairDropdownState(e);
									}}
									body={pairsValues}
								/>
								<Dropdown
									className={styles.orders__buy_sell__filter}
									selfContained
									value={buyDropdownValue}
									setValue={(e) => {
										setBuyDropdownState(e);
									}}
									body={buySellValues}
								/>
								<DateRangeSelector value={dateRange} setValue={setDateRange} />
							</div>

							{!isFinishedCategory && (
								<Button transparent onClick={cancelAllOrders}>
									Cancel all orders
								</Button>
							)}
						</div>
					</div>

					<OrdersTable
						value={orders}
						category={categoryState.code}
						deleteOrder={deleteOrder}
					/>

					<div className={styles['orders__preloader-wrapper']} ref={inViewRef}>
						{orderPageLoading && <Preloader />}
					</div>
				</div>
				{alertState && (
					<Alert
						type={alertState}
						subtitle={alertSubtitle || ''}
						close={() => setAlertState(null)}
					/>
				)}
			</main>
			<Footer className="no-svg-style" />
		</>
	);
}

export default Orders;
