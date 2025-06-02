import styles from '@/styles/Orders.module.scss';
import Header from '@/components/default/Header/Header';
import Footer from '@/components/default/Footer/Footer';
import PageTitle from '@/components/default/PageTitle/PageTitle';
import HorizontalSelect from '@/components/UI/HorizontalSelect/HorizontalSelect';
import { useEffect, useState } from 'react';
import Dropdown from '@/components/UI/Dropdown/Dropdown';
import DateRangeSelector from '@/components/UI/DateRangeSelector/DateRangeSelector';
import Button from '@/components/UI/Button/Button';
import { cancelOrder, getUserOrders } from '@/utils/methods';
import Alert from '@/components/UI/Alert/Alert';
import AlertType from '@/interfaces/common/AlertType';
import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';
import PairValue from '@/interfaces/props/pages/dex/orders/PairValue';
import DateState from '@/interfaces/common/DateState';
import useUpdateUser from '@/hook/useUpdateUser';
import OrdersTable from './OrdersTable/OrdersTable';

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

	useEffect(() => {
		async function getOrders() {
			setAlertState('loading');
			setAlertSubtitle('Loading orders data...');

			const result = await getUserOrders();

			if (!result.success) {
				setAlertState('error');
				setAlertSubtitle('Error loading orders data');
				await new Promise((resolve) => setTimeout(resolve, 2000));
				setAlertState(null);
				setAlertSubtitle('');
				return;
			}

			fetchUser();

			setOrders(result.data);

			function getPairsFromOrders(orders: UserOrderData[]) {
				const pairs = [
					{
						code: '',
						name: 'All pairs',
					},
				];

				for (let i = 0; i < orders.length; i++) {
					const pair = {
						name: `${orders[i].first_currency.name}/${orders[i].second_currency.name}`,
						code: orders[i].pair_id,
					};

					if (!pairs.find((e) => e.code === pair.code)) pairs.push(pair);
				}

				return pairs;
			}

			const pairs = getPairsFromOrders(result.data);

			setPairsValues(pairs);
			setPairDropdownState(pairs[0]);

			setAlertState(null);
			setAlertSubtitle('');

			const { success, data } = await getUserOrders();

			if (success) {
				setOrders(data);
			}
		}

		getOrders();
	}, []);

	function buySellFilter(e: UserOrderData) {
		if (buyDropdownValue.name === 'Buy & Sell') return true;

		if (buyDropdownValue.name === 'Buy') return e.type === 'buy';

		if (buyDropdownValue.name === 'Sell') return e.type === 'sell';
	}

	function pairFilter(e: UserOrderData) {
		if (!pairDropdownValue) return true;

		return !pairDropdownValue.code || e.pair_id === pairDropdownValue.code;
	}

	function dateFilter(e: UserOrderData) {
		if (!dateRange.first || !dateRange.last) return true;
		const firstDate = new Date(dateRange.first);
		const lastDate = new Date(dateRange.last);

		const timestamp = parseInt(e.timestamp, 10);

		firstDate.setHours(0, 0, 0, 0);
		lastDate.setHours(24, 0, 0, 0);

		if (!dateRange.first && !dateRange.last) return true;

		if (dateRange.first && !dateRange.last) return timestamp >= firstDate.getTime();

		if (!dateRange.first && dateRange.last) return timestamp <= lastDate.getTime();

		return timestamp >= firstDate.getTime() && timestamp <= lastDate.getTime();
	}

	function categoryFilter(e: UserOrderData) {
		if (categoryState.code === 'active-orders') {
			return e.status === 'active';
		}
		return e.status === 'finished';
	}

	const activeOrders = orders.filter((e) => e.status === 'active');

	async function cancelAllOrders() {
		setAlertState('loading');
		setAlertSubtitle('Canceling all orders...');

		const results = await Promise.allSettled(
			activeOrders.map(async (e) => {
				await cancelOrder(e.id);
			}),
		);

		if (results.some((e) => e.status === 'rejected')) {
			setAlertState('error');
			setAlertSubtitle('Some of the orders were not canceled');
		} else {
			setAlertState('success');
			setAlertSubtitle('All orders canceled');
		}

		setTimeout(() => {
			setAlertState(null);
			setAlertSubtitle('');
		}, 2000);

		const { success, data } = await getUserOrders();

		if (success) {
			setOrders(data);
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

							<Button transparent onClick={cancelAllOrders}>
								Cancel all orders
							</Button>
						</div>
					</div>

					<OrdersTable
						value={orders
							.filter(buySellFilter)
							.filter(pairFilter)
							.filter(dateFilter)
							.filter(categoryFilter)}
						setAlertState={setAlertState}
						setAlertSubtitle={setAlertSubtitle}
						setOrders={setOrders}
						category={categoryState.code}
					/>
				</div>
				{alertState && (
					<Alert
						type={alertState}
						subtitle={alertSubtitle || ''}
						close={() => setAlertState(null)}
					/>
				)}
			</main>
			<Footer />
		</>
	);
}

export default Orders;
