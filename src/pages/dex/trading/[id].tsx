import styles from '@/styles/Trading.module.scss';
import Footer from '@/components/default/Footer/Footer';
import Header from '@/components/default/Header/Header';
import Dropdown from '@/components/UI/Dropdown/Dropdown';
import HorizontalSelect from '@/components/UI/HorizontalSelect/HorizontalSelect';
import { useCallback, useState } from 'react';
import { cancelOrder } from '@/utils/methods';
import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import Alert from '@/components/UI/Alert/Alert';
import PeriodState from '@/interfaces/states/pages/dex/trading/InputPanelItem/PeriodState';
import OrderRow from '@/interfaces/common/OrderRow';
import ApplyTip from '@/interfaces/common/ApplyTip';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import PairData from '@/interfaces/common/PairData';
import CandleRow from '@/interfaces/common/CandleRow';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import { periods, buySellValues } from '@/constants';
import { useAlert } from '@/hook/useAlert';
import useScroll from '@/hook/useScroll';
import InputPanelItem from '@/components/dex/InputPanelItem';
import TradingHeader from '@/components/dex/TradingHeader';
import UserOrders from '@/components/dex/UserOrders';
import OrdersPool from '@/components/dex/OrdersPool';
import CandleChart from '@/components/dex/CandleChart';
import AllTrades from '@/components/dex/AllTrades';
import { useSocketListeners } from '@/hook/useSocketListeners';
import { useTradingData } from '@/hook/useTradingData';
import useFilteredData from '@/hook/useFilteredData';
import useTradeInit from '@/hook/useTradeInit';
import useMatrixAddresses from '@/hook/useMatrixAddresses';
import takeOrderClick from '@/utils/takeOrderClick';
import useUpdateUser from '@/hook/useUpdateUser';

const CHART_OPTIONS = [{ name: 'Zano Chart' }, { name: 'Trading View', disabled: true }];
const DEFAULT_CHART = CHART_OPTIONS[0];

function Trading() {
	const { alertState, alertSubtitle, setAlertState } = useAlert();
	const { elementRef: orderListRef, scrollToElement: scrollToOrdersList } =
		useScroll<HTMLDivElement>();
	const { elementRef: orderFormRef, scrollToElement: scrollToOrderForm } =
		useScroll<HTMLDivElement>();

	const fetchUser = useUpdateUser();
	const [ordersHistory, setOrdersHistory] = useState<PageOrderData[]>([]);
	const [userOrders, setUserOrders] = useState<OrderRow[]>([]);
	const [periodsState, setPeriodsState] = useState<PeriodState>(periods[0]);
	const [pairData, setPairData] = useState<PairData | null>(null);
	const [candles, setCandles] = useState<CandleRow[]>([]);
	const [trades, setTrades] = useState<Trade[]>([]);
	const [myOrdersLoading, setMyOrdersLoading] = useState(true);
	const [ordersBuySell, setOrdersBuySell] = useState(buySellValues[0]);
	const [pairStats, setPairStats] = useState<PairStats | null>(null);
	const [applyTips, setApplyTips] = useState<ApplyTip[]>([]);
	const matrixAddresses = useMatrixAddresses(ordersHistory);
	const [orderFormType, setOrderFormType] = useState(buySellValues[1]);

	const {
		orderForm,
		currencyNames,
		firstAssetLink,
		secondAssetLink,
		secondAssetUsdPrice,
		balance,
		pairRateUsd,
	} = useTradeInit({ pairData, pairStats });

	const {
		fetchTrades,
		updateOrders,
		updateUserOrders,
		candlesLoaded,
		ordersLoading,
		tradesLoading,
	} = useTradingData({
		periodsState,
		setApplyTips,
		setCandles,
		setMyOrdersLoading,
		setOrdersHistory,
		setPairData,
		setPairStats,
		setTrades,
		setUserOrders,
	});

	useSocketListeners({
		setUserOrders,
		ordersHistory,
		setApplyTips,
		setOrdersHistory,
		setPairStats,
		updateOrders,
	});

	// Take order from trades
	const onHandleTakeOrder = useCallback(
		(event: React.MouseEvent<HTMLTableRowElement, MouseEvent>, e: PageOrderData) => {
			setOrderFormType(() => {
				return e.type === 'buy' ? buySellValues[2] : buySellValues[1];
			});

			takeOrderClick({
				event,
				PageOrderData: e,
				balance,
				orderForm,
				pairData,
				scrollToOrderForm,
			});
		},
		[balance, orderForm, pairData, scrollToOrderForm],
	);

	// Cancel all user orders
	const handleCancelAllOrders = useCallback(async () => {
		if (!userOrders.length) return;

		setMyOrdersLoading(true);

		try {
			await Promise.all(userOrders.map((order) => cancelOrder(order.id)));
			await updateUserOrders();
		} catch (err) {
			console.error(err);
		} finally {
			setMyOrdersLoading(false);
		}
	}, [userOrders, updateUserOrders]);

	const { filteredOrdersHistory } = useFilteredData({
		ordersBuySell,
		ordersHistory,
	});

	const onAfter = async () => {
		await updateOrders();
		await updateUserOrders();
		await fetchUser();
		await fetchTrades();
	};

	return (
		<>
			<Header isLg={true} />

			<main className={styles.trading}>
				<TradingHeader
					pairStats={pairStats}
					pairRateUsd={pairRateUsd}
					firstAssetLink={firstAssetLink}
					secondAssetLink={secondAssetLink}
					firstAssetId={pairData?.first_currency?.asset_id}
					secondAssetId={pairData?.second_currency?.asset_id}
					pairData={pairData}
				/>

				<div className={styles.trading__top}>
					<OrdersPool
						currencyNames={currencyNames}
						secondAssetUsdPrice={secondAssetUsdPrice}
						ordersBuySell={ordersBuySell}
						ordersLoading={ordersLoading}
						filteredOrdersHistory={filteredOrdersHistory}
						trades={trades}
						tradesLoading={tradesLoading}
						setOrdersBuySell={setOrdersBuySell}
						takeOrderClick={onHandleTakeOrder}
						matrixAddresses={matrixAddresses}
					/>

					<div className={styles.trading__top_chart}>
						<div className={styles.settings}>
							<HorizontalSelect
								body={periods}
								value={periodsState}
								setValue={setPeriodsState}
								isTab
							/>
							<Dropdown
								body={CHART_OPTIONS}
								className={styles.settings__dropdown}
								selfContained
								value={DEFAULT_CHART}
								setValue={() => undefined}
							/>
						</div>

						{candlesLoaded ? (
							<CandleChart candles={candles} period={periodsState.code} />
						) : (
							<ContentPreloader style={{ height: '100%' }} />
						)}
					</div>

					<div ref={orderFormRef} className={styles.trading__top_form}>
						<InputPanelItem
							currencyNames={currencyNames}
							priceState={orderForm.price}
							amountState={orderForm.amount}
							totalState={orderForm.total}
							buySellState={orderFormType}
							setBuySellState={setOrderFormType}
							setPriceFunction={orderForm.onPriceChange}
							setAmountFunction={orderForm.onAmountChange}
							setRangeInputValue={orderForm.setRangeInputValue}
							rangeInputValue={orderForm.rangeInputValue}
							balance={Number(balance)}
							priceValid={orderForm.priceValid}
							amountValid={orderForm.amountValid}
							totalValid={orderForm.totalValid}
							totalUsd={orderForm.totalUsd}
							scrollToOrderList={scrollToOrdersList}
							onAfter={onAfter}
						/>
					</div>
					{/* <AllTrades
						currencyNames={currencyNames}
						filteredTrades={filteredTrades}
						setTradesType={setTradesType}
						tradesLoading={tradesLoading}
						tradesType={tradesType}
					/> */}
				</div>

				<div className={styles.trading__info}>
					<UserOrders
						orderListRef={orderListRef}
						userOrders={userOrders}
						applyTips={applyTips}
						myOrdersLoading={myOrdersLoading}
						handleCancelAllOrders={handleCancelAllOrders}
						matrixAddresses={matrixAddresses}
						secondAssetUsdPrice={secondAssetUsdPrice}
						pairData={pairData}
						onAfter={onAfter}
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

export default Trading;
