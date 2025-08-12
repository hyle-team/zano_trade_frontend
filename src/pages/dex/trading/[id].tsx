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
import CandleChart from './components/CandleChart';
import InputPanelItem from './components/InputPanelItem';
import TradingHeader from './components/TradingHeader';
import UserOrders from './components/UserOrders';
import AllTrades from './components/AllTrades';
import OrdersPool from './components/OrdersPool';
import { useSocketListeners } from './hooks/useSocketListeners';
import { useTradingData } from './hooks/useTradingData';
import takeOrderClick from './helpers/takeOrderClick';
import useFilteredData from './hooks/useFilteredData';
import useTradeInit from './hooks/useTradeInit';
import useMatrixAddresses from './hooks/useMatrixAddresses';

const CHART_OPTIONS = [{ name: 'Zano Chart' }, { name: 'Trading View', disabled: true }];
const DEFAULT_CHART = CHART_OPTIONS[0];

function Trading() {
	const { alertState, alertSubtitle, setAlertState } = useAlert();
	const { elementRef: orderListRef, scrollToElement: scrollToOrdersList } =
		useScroll<HTMLDivElement>();
	const { elementRef: orderFormRef, scrollToElement: scrollToOrderForm } =
		useScroll<HTMLDivElement>();

	const [ordersHistory, setOrdersHistory] = useState<PageOrderData[]>([]);
	const [userOrders, setUserOrders] = useState<OrderRow[]>([]);
	const [periodsState, setPeriodsState] = useState<PeriodState>(periods[0]);
	const [pairData, setPairData] = useState<PairData | null>(null);
	const [candles, setCandles] = useState<CandleRow[]>([]);
	const [trades, setTrades] = useState<Trade[]>([]);
	const [myOrdersLoading, setMyOrdersLoading] = useState(true);
	const [ordersBuySell, setOrdersBuySell] = useState(buySellValues[0]);
	const [tradesType, setTradesType] = useState<'all' | 'my'>('all');
	const [ordersType, setOrdersType] = useState<'opened' | 'history'>('opened');
	const [pairStats, setPairStats] = useState<PairStats | null>(null);
	const [applyTips, setApplyTips] = useState<ApplyTip[]>([]);
	const matrixAddresses = useMatrixAddresses(ordersHistory);

	const {
		buyForm,
		sellForm,
		currencyNames,
		firstAssetLink,
		secondAssetLink,
		secondAssetUsdPrice,
		balance,
		loggedIn,
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
		(
			event:
				| React.MouseEvent<HTMLAnchorElement, MouseEvent>
				| React.MouseEvent<HTMLTableRowElement, MouseEvent>,
			e: PageOrderData,
		) => {
			takeOrderClick({
				event,
				PageOrderData: e,
				balance,
				buyForm,
				pairData,
				scrollToOrderForm,
				sellForm,
			});
		},
		[balance, buyForm, pairData, scrollToOrderForm, sellForm],
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

	const { filteredOrdersHistory, filteredTrades } = useFilteredData({
		ordersBuySell,
		ordersHistory,
		trades,
		tradesType,
	});

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
						filteredOrdersHistory={filteredOrdersHistory}
						ordersBuySell={ordersBuySell}
						ordersLoading={ordersLoading}
						secondAssetUsdPrice={secondAssetUsdPrice}
						setOrdersBuySell={setOrdersBuySell}
						takeOrderClick={onHandleTakeOrder}
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

					<AllTrades
						currencyNames={currencyNames}
						filteredTrades={filteredTrades}
						setTradesType={setTradesType}
						tradesLoading={tradesLoading}
						tradesType={tradesType}
					/>
				</div>

				<div className={styles.trading__info}>
					<UserOrders
						orderListRef={orderListRef}
						userOrders={userOrders}
						applyTips={applyTips}
						myOrdersLoading={myOrdersLoading}
						loggedIn={loggedIn}
						ordersType={ordersType}
						setOrdersType={setOrdersType}
						handleCancelAllOrders={handleCancelAllOrders}
						matrixAddresses={matrixAddresses}
						secondAssetUsdPrice={secondAssetUsdPrice}
						updateOrders={updateOrders}
						updateUserOrders={updateUserOrders}
						fetchTrades={fetchTrades}
						pairData={pairData}
					/>

					<div ref={orderFormRef} className={styles.trading__info_createOrders}>
						{['buy', 'sell'].map((type) => {
							const isBuy = type === 'buy';
							const form = isBuy ? buyForm : sellForm;

							return (
								<InputPanelItem
									key={type}
									currencyNames={currencyNames}
									priceState={form.price}
									amountState={form.amount}
									totalState={form.total}
									buySellValues={buySellValues}
									buySellState={isBuy ? buySellValues[1] : buySellValues[2]}
									setPriceFunction={form.onPriceChange}
									setAmountFunction={form.onAmountChange}
									setRangeInputValue={form.setRangeInputValue}
									rangeInputValue={form.rangeInputValue}
									balance={Number(balance)}
									priceValid={form.priceValid}
									amountValid={form.amountValid}
									totalValid={form.totalValid}
									totalUsd={form.totalUsd}
									scrollToOrderList={scrollToOrdersList}
								/>
							);
						})}
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
			<Footer />
		</>
	);
}

export default Trading;
