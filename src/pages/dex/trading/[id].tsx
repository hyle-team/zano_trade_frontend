import styles from '@/styles/Trading.module.scss';
import Footer from '@/components/default/Footer/Footer';
import Header from '@/components/default/Header/Header';
import { ReactComponent as ClockIcon } from '@/assets/images/UI/clock_icon.svg';
import { ReactComponent as UpIcon } from '@/assets/images/UI/up_icon.svg';
import { ReactComponent as DownIcon } from '@/assets/images/UI/down_icon.svg';
import { ReactComponent as VolumeIcon } from '@/assets/images/UI/volume_icon.svg';
import { ReactComponent as NoOffersIcon } from '@/assets/images/UI/no_offers.svg';
import Dropdown from '@/components/UI/Dropdown/Dropdown';
import HorizontalSelect from '@/components/UI/HorizontalSelect/HorizontalSelect';
import { useContext, useEffect, useRef, useState } from 'react';
import { Store } from '@/store/store-reducer';
import { useRouter } from 'next/router';
import {
	applyOrder,
	cancelOrder,
	getOrdersPage,
	confirmTransaction,
	getPair,
	getPairStats,
	getUserOrdersPage,
	getCandles,
	getTrades,
} from '@/utils/methods';
import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import {
	classes,
	cutAddress,
	formatDollarValue,
	formatTime,
	isPositiveFloatStr,
	notationToString,
	roundTo,
	shortenAddress,
	tradingKnownCurrencies,
} from '@/utils/utils';
import Alert from '@/components/UI/Alert/Alert';
import socket from '@/utils/socket';
import SelectValue from '@/interfaces/states/pages/dex/trading/InputPanelItem/SelectValue';
import AlertType from '@/interfaces/common/AlertType';
import PeriodState from '@/interfaces/states/pages/dex/trading/InputPanelItem/PeriodState';
import OrderRow from '@/interfaces/common/OrderRow';
import ApplyTip from '@/interfaces/common/ApplyTip';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import PairData from '@/interfaces/common/PairData';
import CandleRow from '@/interfaces/common/CandleRow';
import StatItemProps from '@/interfaces/props/pages/dex/trading/StatItemProps';
import { confirmIonicSwap, ionicSwap } from '@/utils/wallet';
import Decimal from 'decimal.js';
import Tooltip from '@/components/UI/Tooltip/Tooltip';
import { updateAutoClosedNotification } from '@/store/actions';
import useUpdateUser from '@/hook/useUpdateUser';
import LightningImg from '@/assets/images/UI/lightning.png';
import RocketImg from '@/assets/images/UI/rocket.png';
import { ReactComponent as ConnectionIcon } from '@/assets/images/UI/connection.svg';
import Image from 'next/image';
import BackButton from '@/components/default/BackButton/BackButton';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import CandleChart from './CandleChart/CandleChart';
import InputPanelItem from './InputPanelItem/InputPanelItem';
import { validateTokensInput } from '../../../../shared/utils';

function BadgeStatus({ type = 'instant', icon }: { type?: 'instant' | 'high'; icon?: boolean }) {
	return (
		<div className={classes(styles.badge, type === 'high' && styles.high, icon && styles.icon)}>
			<Image src={type === 'instant' ? LightningImg : RocketImg} alt="badge image" />
			{!icon && <span>{type === 'instant' ? 'instant' : 'high volume'}</span>}
		</div>
	);
}

function Trading() {
	const router = useRouter();
	const fetchUser = useUpdateUser();

	const [ordersHistory, setOrdersHistory] = useState<PageOrderData[]>([]);

	const orderFormRef = useRef<HTMLDivElement>(null);
	const orderListRef = useRef<HTMLDivElement>(null);

	const pairId = typeof router.query.id === 'string' ? router.query.id : '';

	const periods: PeriodState[] = [
		{
			name: '1H',
			code: '1h',
		},
		{
			name: '1D',
			code: '1d',
		},
		{
			name: '1W',
			code: '1w',
		},
		{
			name: '1M',
			code: '1m',
		},
	];

	const buySellValues: SelectValue[] = [
		{
			name: 'All',
			code: 'all',
		},
		{
			name: 'Buy',
			code: 'buy',
		},
		{
			name: 'Sell',
			code: 'sell',
		},
	];

	const { state, dispatch } = useContext(Store);

	const [userOrders, setUserOrders] = useState<OrderRow[]>([]);

	const [periodsState, setPeriodsState] = useState<PeriodState>(periods[0]);

	const [pairData, setPairData] = useState<PairData | null>(null);

	const [candles, setCandles] = useState<CandleRow[]>([]);

	const [candlesLoaded, setCandlesLoaded] = useState(false);

	const [ordersLoading, setOrdersLoading] = useState(true);

	const [trades, setTrades] = useState<Trade[]>([]);
	const [tradesLoading, setTradesLoading] = useState(true);

	const [myOrdersLoading, setMyOrdersLoading] = useState(true);

	const [ordersBuySell, setOrdersBuySell] = useState(buySellValues[0]);

	const [tradesType, setTradesType] = useState<'all' | 'my'>('all');

	const [ordersType, setOrdersType] = useState<'opened' | 'history'>('opened');

	const [pairStats, setPairStats] = useState<PairStats | null>(null);

	const [applyTips, setApplyTips] = useState<ApplyTip[]>([]);

	const [alertState, setAlertState] = useState<AlertType>(null);

	const [alertSubtitle, setAlertSubtitle] = useState<string>('');

	const [ordersInfoTooltip, setOrdersInfoTooltip] = useState<PageOrderData | null>(null);
	const ordersInfoRef = useRef<HTMLTableSectionElement | null>(null);
	const [infoTooltipPos, setInfoTooltipPos] = useState({ x: 0, y: 0 });

	async function fetchTrades() {
		setTradesLoading(true);
		const result = await getTrades(pairId);

		if (result.success) {
			setTrades(result.data);
		}

		setTradesLoading(false);
	}

	useEffect(() => {
		(async () => {
			await fetchTrades();
		})();
	}, [pairId]);

	const filteredTrades =
		tradesType === 'my'
			? trades.filter(
					(trade) =>
						trade.buyer.address === state.wallet?.address ||
						trade.seller.address === state.wallet?.address,
				)
			: trades;

	useEffect(() => {
		const targetEl = (event: MouseEvent) => {
			if (ordersInfoRef.current && !ordersInfoRef.current.contains(event.target as Node)) {
				setOrdersInfoTooltip(null);
			}
		};

		window.addEventListener('mousemove', targetEl);

		return () => {
			window.removeEventListener('mousemove', targetEl);
		};
	}, []);

	const moveInfoTooltip = (event: React.MouseEvent) => {
		setInfoTooltipPos({ x: event.clientX, y: event.clientY });
	};

	const [matrixAddresses, setMatrixAddresses] = useState([]);

	async function updateOrders() {
		setOrdersLoading(true);
		const result = await getOrdersPage(pairId);
		if (!result.success) return;
		setOrdersHistory(result?.data || []);
		setOrdersLoading(false);
	}

	async function socketUpdateOrders() {
		const result = await getUserOrdersPage(pairId);

		if (result.success) {
			setUserOrders(result?.data?.orders || []);
			setApplyTips(result?.data?.applyTips || []);
		}
	}

	useEffect(() => {
		socket.emit('in-trading', { id: router.query.id });

		return () => {
			socket.emit('out-trading', { id: router.query.id });
		};
	}, []);

	useEffect(() => {
		socket.on('new-order', async (data) => {
			setOrdersHistory([data.orderData, ...ordersHistory]);
			await socketUpdateOrders();
		});

		socket.on('delete-order', async () => {
			await updateOrders();
			await socketUpdateOrders();
		});

		return () => {
			socket.off('new-order');
			socket.off('delete-order');
		};
	}, [ordersHistory]);

	useEffect(() => {
		function onUpdateStats({ pairStats }: { pairStats: PairStats }) {
			setPairStats(pairStats);
		}

		socket.on('update-pair-stats', onUpdateStats);

		return () => {
			socket.off('update-pair-stats', onUpdateStats);
		};
	}, []);

	useEffect(() => {
		socket.on('update-orders', async () => {
			await socketUpdateOrders();
		});

		return () => {
			socket.off('update-orders');
		};
	}, []);

	// Detect registered addresses
	const hasConnection = (address: string) =>
		matrixAddresses.some(
			(item: { address: string; registered: boolean }) =>
				item.address === address && item.registered,
		);

	const filteredOrdersHistory = ordersHistory
		?.filter((e) => (ordersBuySell.code === 'all' ? e : e.type === ordersBuySell.code))
		?.filter((e) => e.user.address !== state.wallet?.address)
		?.sort((a, b) => {
			if (ordersBuySell.code === 'buy') {
				return parseFloat(b.price.toString()) - parseFloat(a.price.toString());
			}
			return parseFloat(a.price.toString()) - parseFloat(b.price.toString());
		});

	// Get registered addresses from matrix
	useEffect(() => {
		const fetchConnections = async () => {
			const filteredAddresses = ordersHistory?.map((e) => e?.user?.address);
			if (!filteredAddresses.length) return;
			const response = await fetch('https://messenger.zano.org/api/get-addresses', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					addresses: filteredAddresses,
				}),
			});

			const data = await response.json();
			setMatrixAddresses(data.addresses);
		};

		fetchConnections();
	}, [ordersHistory]);

	const firstCurrencyName = pairData?.first_currency?.name || '';
	const secondCurrencyName = pairData?.second_currency?.name || '';

	const firstAssetId = pairData ? pairData.first_currency?.asset_id : undefined;
	const secondAssetId = pairData ? pairData.second_currency?.asset_id : undefined;
	const firstAssetLink = firstAssetId
		? `https://explorer.zano.org/assets?asset_id=${encodeURIComponent(firstAssetId)}`
		: undefined;
	const secondAssetLink = secondAssetId
		? `https://explorer.zano.org/assets?asset_id=${encodeURIComponent(secondAssetId)}`
		: undefined;

	const secondAssetUsdPrice = state.assetsRates.get(secondAssetId || '');
	const secondCurrencyDP = pairData?.second_currency.asset_info?.decimal_point || 12;

	useEffect(() => {
		async function fetchPairStats() {
			const result = await getPairStats(pairId);
			if (!result.success) return;
			setPairStats(result.data);
		}

		fetchPairStats();
	}, []);

	useEffect(() => {
		async function fetchCandles() {
			setCandlesLoaded(false);
			setCandles([]);
			const result = await getCandles(pairId, periodsState.code);
			if (result.success) {
				setCandles(result.data);
			} else {
				setCandles([]);
			}
			setCandlesLoaded(true);
		}

		fetchCandles();
	}, [periodsState]);

	useEffect(() => {
		async function getPairData() {
			const result = await getPair(pairId);
			if (!result.success) {
				router.push('/404');
				return;
			}
			setPairData(result.data);
		}

		getPairData();
	}, []);

	async function updateUserOrders() {
		setMyOrdersLoading(true);
		const result = await getUserOrdersPage(pairId);
		console.log('result getuserorderspage', result);
		await fetchUser();

		if (!result.success) return;
		setUserOrders(result?.data?.orders || []);
		setApplyTips(result?.data?.applyTips || []);
		setMyOrdersLoading(false);
	}

	const loggedIn = !!state.wallet?.connected;

	useEffect(() => {
		if (!loggedIn) return;
		setUserOrders([]);
		updateUserOrders();
	}, [state.wallet?.connected && state.wallet?.address]);

	useEffect(() => {
		updateOrders();
	}, []);

	// useEffect(() => {
	//     socket.on
	// }, []);

	const [priceState, setPriceState] = useState('');
	const [amountState, setAmountState] = useState('');
	const [totalState, setTotalState] = useState('');

	const [priceSellState, setPriceSellState] = useState('');
	const [amountSellState, setAmountSellState] = useState('');
	const [totalSellState, setTotalSellState] = useState('');

	const [totalUsd, setTotalUsd] = useState<string | undefined>(undefined);
	const [totalSellUsd, setTotalSellUsd] = useState<string | undefined>(undefined);

	const [priceValid, setPriceValid] = useState(false);
	const [amountValid, setAmountValid] = useState(false);
	const [totalValid, setTotalValid] = useState(false);
	const [priceSellValid, setPriceSellValid] = useState(false);
	const [amountSellValid, setAmountSellValid] = useState(false);
	const [totalSellValid, setTotalSellValid] = useState(false);

	const [buySellState, setBuySellState] = useState(buySellValues[0]);

	const [rangeInputValue, setRangeInputValue] = useState('50');
	const [rangeInputSellValue, setRangeInputSellValue] = useState('50');

	useEffect(() => {
		let totalDecimal: Decimal | undefined;

		try {
			totalDecimal = new Decimal(totalState);
		} catch (err) {
			console.log(err);
		}

		const zanoPrice = state.assetsRates.get(pairData?.second_currency?.asset_id || '');

		setTotalUsd(zanoPrice && totalDecimal ? totalDecimal.mul(zanoPrice).toFixed(2) : undefined);
	}, [totalState, state.assetsRates, pairData?.second_currency?.asset_id]);

	useEffect(() => {
		let totalSellDecimal: Decimal | undefined;

		try {
			totalSellDecimal = new Decimal(totalSellState);
		} catch (error) {
			console.log(error);
		}

		const zanoPrice = state.assetsRates.get(pairData?.second_currency?.asset_id || '');

		setTotalSellUsd(
			zanoPrice && totalSellDecimal ? totalSellDecimal.mul(zanoPrice).toFixed(2) : undefined,
		);
	}, [totalSellState, state.assetsRates, pairData?.second_currency?.asset_id]);

	function setPriceFunction(inputValue: string) {
		if (inputValue !== '' && !isPositiveFloatStr(inputValue)) {
			return;
		}

		try {
			const value = new Decimal(inputValue || NaN);

			if (value.toString().replace('.', '').length > 18) {
				console.log('TOO MANY DECIMALS');
				return;
			}
		} catch (error) {
			console.log(error);
		}

		setPriceState(inputValue);

		if (!inputValue) {
			setTotalState('');
			setTotalValid(false);
			setPriceValid(false);
			return;
		}

		const valueDecimal = new Decimal(inputValue || NaN);
		const amountDecimal = new Decimal(amountState || NaN);

		const validationResult = validateTokensInput(inputValue, secondCurrencyDP);

		if (!validationResult.valid) {
			setTotalState('');
			setTotalValid(false);
			setPriceValid(false);
			return;
		}

		setPriceValid(true);

		if (!valueDecimal.isNaN() && !amountDecimal.isNaN() && amountState !== '') {
			const totalDecimal = valueDecimal.mul(amountDecimal);
			setTotalState(totalDecimal.toString());
			const total = totalDecimal.toFixed(secondCurrencyDP);

			const totalValidationResult = validateTokensInput(total, secondCurrencyDP);

			setTotalValid(totalValidationResult.valid);
		} else {
			setTotalState('');
			setTotalValid(false);
		}
	}

	function setPriceSellFunction(inputValue: string) {
		if (inputValue !== '' && !isPositiveFloatStr(inputValue)) {
			return;
		}

		try {
			const value = new Decimal(inputValue || NaN);

			if (value.toString().replace('.', '').length > 18) {
				console.log('TOO MANY DECIMALS');
				return;
			}
		} catch (error) {
			console.log(error);
		}

		setPriceSellState(inputValue);

		if (!inputValue) {
			setTotalSellState('');
			setTotalSellValid(false);
			setPriceSellValid(false);
			return;
		}

		const valueDecimal = new Decimal(inputValue || NaN);
		const amountDecimal = new Decimal(amountSellState || NaN);

		const secondCurrencyDP = pairData?.second_currency.asset_info?.decimal_point || 12;

		const validationResult = validateTokensInput(inputValue, secondCurrencyDP);

		if (!validationResult.valid) {
			setTotalSellState('');
			setTotalSellValid(false);
			setPriceSellValid(false);
			return;
		}

		setPriceSellValid(true);

		if (!valueDecimal.isNaN() && !amountDecimal.isNaN() && amountSellState !== '') {
			const total = valueDecimal.mul(amountDecimal).toFixed();
			setTotalSellState(total);

			const totalValidationResult = validateTokensInput(total, secondCurrencyDP);

			setTotalSellValid(totalValidationResult.valid);
		} else {
			setTotalSellState('');
			setTotalSellValid(false);
		}
	}

	const assets = state.wallet?.connected ? state.wallet?.assets || [] : [];

	const balance = assets.find((e) => e.ticker === firstCurrencyName)?.balance;

	function setAmountFunction(inputValue: string) {
		if (inputValue !== '' && !isPositiveFloatStr(inputValue)) {
			return;
		}

		try {
			const value = new Decimal(inputValue || NaN);

			if (value.toString().replace('.', '').length > 18) {
				console.log('TOO MANY DECIMALS');
				return;
			}
		} catch (error) {
			console.log(error);
		}

		setAmountState(inputValue);

		if (!inputValue) {
			setTotalState('');
			setTotalValid(false);
			setAmountValid(false);
			return;
		}

		const value = new Decimal(inputValue || NaN);
		const price = new Decimal(priceState || NaN);

		const validationResult = validateTokensInput(
			inputValue,
			pairData?.first_currency.asset_info?.decimal_point || 12,
		);
		console.log(validationResult);

		if (!validationResult.valid) {
			setTotalState('');
			setTotalValid(false);
			setAmountValid(false);
			return;
		}

		setAmountValid(true);

		if (balance) setRangeInputValue(value.div(balance).mul(100).toFixed());

		if (!price.isNaN() && !value.isNaN() && priceState !== '') {
			const totalDecimal = value.mul(price);
			setTotalState(totalDecimal.toString());
			const total = totalDecimal.toFixed(secondCurrencyDP);
			const totalValidationResult = validateTokensInput(total, secondCurrencyDP);

			setTotalValid(totalValidationResult.valid);
		} else {
			setTotalState('');
			setTotalValid(false);
		}
	}

	function setAmountSellFunction(inputValue: string) {
		if (inputValue !== '' && !isPositiveFloatStr(inputValue)) {
			return;
		}

		try {
			const value = new Decimal(inputValue || NaN);

			if (value.toString().replace('.', '').length > 18) {
				console.log('TOO MANY DECIMALS');
				return;
			}
		} catch (error) {
			console.log(error);
		}

		setAmountSellState(inputValue);

		if (!inputValue) {
			setTotalSellState('');
			setTotalSellValid(false);
			setAmountSellValid(false);
			return;
		}

		const value = new Decimal(inputValue || NaN);
		const price = new Decimal(priceSellState || NaN);

		const validationResult = validateTokensInput(
			inputValue,
			pairData?.first_currency.asset_info?.decimal_point || 12,
		);
		console.log(validationResult);

		if (!validationResult.valid) {
			setTotalSellState('');
			setTotalSellValid(false);
			setAmountSellValid(false);
			return;
		}

		setAmountSellValid(true);

		if (balance) setRangeInputSellValue(value.div(balance).mul(100).toFixed());

		if (!price.isNaN() && !value.isNaN() && priceSellState !== '') {
			const total = value.mul(price).toFixed();
			setTotalSellState(total);

			const totalValidationResult = validateTokensInput(
				total,
				pairData?.second_currency.asset_info?.decimal_point || 12,
			);

			setTotalSellValid(totalValidationResult.valid);
		} else {
			setTotalSellState('');
			setTotalSellValid(false);
		}
	}

	function setCorrespondingOrder(price: number, amount: number) {
		const priceDecimal = new Decimal(price || 0);
		const amountDecimal = new Decimal(amount || 0);
		const totalDecimal = priceDecimal.mul(amountDecimal);

		setPriceFunction(notationToString(priceDecimal.toString()) || '');
		setAmountFunction(notationToString(amountDecimal.toString()) || '');
		setTotalState(notationToString(totalDecimal.toString()) || '');

		if (balance) {
			const balanceDecimal = new Decimal(balance);

			const percentageDecimal = amountDecimal.div(balanceDecimal).mul(100);
			setRangeInputValue(percentageDecimal.toFixed() || '');
		}

		const total = priceDecimal.mul(amountDecimal).toFixed(secondCurrencyDP);

		const totalValidationResult = validateTokensInput(
			total,
			pairData?.second_currency.asset_info?.decimal_point || 12,
		);

		setTotalValid(totalValidationResult.valid);
	}

	function setCorrespondingSellOrder(price: number, amount: number) {
		const priceDecimal = new Decimal(price || 0);
		const amountDecimal = new Decimal(amount || 0);
		const totalDecimal = priceDecimal.mul(amountDecimal);

		setPriceSellFunction(notationToString(priceDecimal.toString()) || '');
		setAmountSellFunction(notationToString(amountDecimal.toString()) || '');
		setTotalSellState(notationToString(totalDecimal.toString()) || '');

		if (balance) {
			const balanceDecimal = new Decimal(balance);

			const percentageDecimal = amountDecimal.div(balanceDecimal).mul(100);
			setRangeInputSellValue(percentageDecimal.toFixed() || '');
		}

		const total = priceDecimal.mul(amountDecimal).toFixed();

		const totalValidationResult = validateTokensInput(
			total,
			pairData?.second_currency.asset_info?.decimal_point || 12,
		);

		setTotalSellValid(totalValidationResult.valid);
	}

	function StatItem(props: StatItemProps) {
		const { Img } = props;

		return (
			<div className={styles.trading__stat__item}>
				<div className={styles.trading__stat__item_nav}>
					<Img />
					<p>{props.title}</p>
				</div>
				<div className={styles.trading__stat__item_content}>
					<p className={styles.val}>{props.value}</p>
					{props.coefficient !== undefined && (
						<p
							className={classes(
								styles.coefficient,
								props.coefficient >= 0
									? styles.coefficient__green
									: styles.coefficient__red,
							)}
						>
							{props.coefficient >= 0 ? '+' : ''}
							{props.coefficient?.toFixed(2)}%
						</p>
					)}
				</div>
			</div>
		);
	}

	function takeOrderClick(
		event:
			| React.MouseEvent<HTMLAnchorElement, MouseEvent>
			| React.MouseEvent<HTMLTableRowElement, MouseEvent>,
		e: PageOrderData,
	) {
		event.preventDefault();

		if (e.type === 'buy') {
			setCorrespondingOrder(e.price, e.amount);
			setBuySellState(buySellValues[1]);
		} else {
			setCorrespondingSellOrder(e.price, e.amount);
			setBuySellState(buySellValues[2]);
		}

		if (!orderFormRef.current) return;

		orderFormRef.current.scrollIntoView({ behavior: 'smooth' });
	}

	//* * FOR USAGE IN THIS PAGE TABLES ONLY */
	function OrderRowTooltipCell({
		style,
		children,
		sideText,
		sideTextColor,
		noTooltip,
	}: {
		style?: React.CSSProperties;
		children: string | React.ReactNode;
		sideText?: string;
		sideTextColor?: string;
		noTooltip?: boolean;
	}) {
		const [showTooltip, setShowTooltip] = useState(false);

		const tooltipText = `${children}${sideText ? ` ~${sideText}` : ''}`;

		const isLongContent = tooltipText.length > 14;

		return (
			<td>
				<p
					style={style}
					onMouseEnter={() => setShowTooltip(true)}
					onMouseLeave={() => setShowTooltip(false)}
				>
					{children}
					{sideText && (
						<span
							style={{
								fontSize: '15px',
								margin: 0,
								color: sideTextColor || 'var(--font-dimmed-color)',
							}}
						>
							{sideText}
						</span>
					)}
				</p>
				{isLongContent && !noTooltip && (
					<Tooltip
						className={styles.table__tooltip}
						arrowClass={styles.table__tooltip_arrow}
						shown={showTooltip}
					>
						{tooltipText}
					</Tooltip>
				)}
			</td>
		);
	}

	function MatrixConnectionBadge({
		userAdress,
		userAlias,
	}: {
		userAdress?: string;
		userAlias?: string;
	}) {
		const [connectionTooltip, setConnectionTooltip] = useState(false);
		return userAdress && hasConnection(userAdress) ? (
			<>
				<a
					href={`https://matrix.to/#/@${userAlias}:zano.org`}
					target="_blank"
					onMouseEnter={() => setConnectionTooltip(true)}
					onMouseLeave={() => setConnectionTooltip(false)}
					style={{ marginTop: '4px', cursor: 'pointer', position: 'relative' }}
				>
					<ConnectionIcon />
				</a>
				<Tooltip
					className={styles.alias__tooltip}
					arrowClass={styles.alias__tooltip_arrow}
					shown={connectionTooltip}
				>
					Matrix connection
				</Tooltip>
			</>
		) : (
			<></>
		);
	}

	function OrdersRow(props: { orderData: PageOrderData; percentage: number }) {
		const e = props?.orderData || {};
		const percentage = props?.percentage;

		const totalDecimal = new Decimal(e.left).mul(new Decimal(e.price));

		return (
			<tr
				onMouseEnter={() => setOrdersInfoTooltip(e)}
				onClick={(event) => takeOrderClick(event, e)}
				className={e.type === 'sell' ? styles.sell_section : ''}
				style={{ '--line-width': `${percentage}%` } as React.CSSProperties}
				key={nanoid(16)}
			>
				<OrderRowTooltipCell
					style={{
						color: e.type === 'buy' ? '#16D1D6' : '#FF6767',
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
						maxWidth: 'max-content',
					}}
				>
					{notationToString(e.price)}
				</OrderRowTooltipCell>
				<OrderRowTooltipCell>{notationToString(e.amount)}</OrderRowTooltipCell>
				{/* <OrderRowTooltipCell>{notationToString(e.left)}</OrderRowTooltipCell> */}
				<OrderRowTooltipCell
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
						maxWidth: 'max-content',
					}}
				>
					{notationToString(totalDecimal.toString())}
				</OrderRowTooltipCell>
			</tr>
		);
	}

	function MyOrdersRow(props: { orderData: OrderRow }) {
		const e = props?.orderData || {};
		const [cancellingState, setCancellingState] = useState(false);

		const totalDecimal = new Decimal(e.left).mul(new Decimal(e.price));
		const totalValue = secondAssetUsdPrice
			? totalDecimal.mul(secondAssetUsdPrice).toFixed(2)
			: undefined;

		const [showTooltip, setShowTooltip] = useState(false);

		async function cancelClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
			event.preventDefault();

			setCancellingState(true);
			const result = await cancelOrder(e.id);

			setCancellingState(false);

			if (!result.success) {
				setAlertState('error');
				setAlertSubtitle('Error while cancelling order');
				setTimeout(() => {
					setAlertState(null);
					setAlertSubtitle('');
				}, 3000);
				return;
			}

			await updateOrders();
			await updateUserOrders();
			await fetchUser();
		}

		return (
			<tr key={nanoid(16)}>
				<td>
					<p
						className={styles.alias}
						onMouseEnter={() => setShowTooltip(true)}
						onMouseLeave={() => setShowTooltip(false)}
					>
						@
						{cutAddress(
							state.wallet?.connected && state.wallet?.alias
								? state.wallet.alias
								: 'no alias',
							12,
						)}
						<MatrixConnectionBadge
							userAdress={state?.wallet?.address}
							userAlias={state.wallet?.alias}
						/>
						{e.isInstant && (
							<div style={{ marginLeft: 2 }}>
								<BadgeStatus icon />
							</div>
						)}
					</p>

					{(state.wallet?.connected && state.wallet?.alias ? state.wallet?.alias : '')
						?.length > 12 && (
						<Tooltip
							className={styles.table__tooltip_right}
							arrowClass={styles.table__tooltip_arrow}
							shown={showTooltip}
						>
							{state.wallet?.connected && state.wallet?.alias}
						</Tooltip>
					)}
					{/* High volume */}
					{/* <BadgeStatus type="high" /> */}
				</td>
				<OrderRowTooltipCell style={{ color: e.type === 'buy' ? '#16D1D6' : '#FF6767' }}>
					{notationToString(e.price)}
				</OrderRowTooltipCell>
				<OrderRowTooltipCell>{notationToString(e.amount)}</OrderRowTooltipCell>

				<OrderRowTooltipCell
					noTooltip
					style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
				>
					{notationToString(totalDecimal.toString())}{' '}
					<span>~ ${totalValue && formatDollarValue(totalValue)}</span>
				</OrderRowTooltipCell>

				{/* <td>{localeTimeLeft(now, parseInt(e.expiration_timestamp, 10))}</td> */}

				<td>
					<p style={{ fontWeight: 700, color: '#1F8FEB' }}>
						{applyTips?.filter((tip) => tip.connected_order_id === e.id)?.length || 0}
					</p>
				</td>
				<td>
					<Link href="/" onClick={cancelClick}>
						{cancellingState ? 'Process' : 'Cancel'}
					</Link>
				</td>
			</tr>
		);
	}

	function MyOrdersApplyRow(props: { orderData: ApplyTip }) {
		const e = props?.orderData || {};

		const [applyingState, setApplyingState] = useState(false);

		const connectedOrder = userOrders.find((order) => order.id === e.connected_order_id);

		const totalDecimal = new Decimal(e.left).mul(new Decimal(e.price));
		const totalValue = secondAssetUsdPrice
			? totalDecimal.mul(secondAssetUsdPrice).toFixed(2)
			: undefined;

		const [showTooltip, setShowTooltip] = useState(false);

		async function applyClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
			event.preventDefault();

			if (e.id) {
				updateAutoClosedNotification(dispatch, [
					...state.closed_notifications,
					parseInt(e.id, 10),
				]);
			}

			function alertErr(subtitle: string) {
				setAlertState('error');
				setAlertSubtitle(subtitle);
				setTimeout(() => {
					setAlertState(null);
					setAlertSubtitle('');
				}, 3000);
			}

			setApplyingState(true);
			interface SwapOperationResult {
				success: boolean;
				message?: string;
				errorCode?: number;
				data?: unknown;
			}

			let result: SwapOperationResult | null = null;

			await (async () => {
				if (e.transaction) {
					if (!e.hex_raw_proposal) {
						alertErr('Invalid transaction data received');
						return;
					}

					console.log(e.hex_raw_proposal);

					const confirmSwapResult = await confirmIonicSwap(e.hex_raw_proposal);

					console.log(confirmSwapResult);

					if (confirmSwapResult.data?.error?.code === -7) {
						alertErr('Insufficient funds');
						return;
					}
					if (!confirmSwapResult.data?.result) {
						alertErr('Companion responded with an error');
						return;
					}

					result = await confirmTransaction(e.id);
				} else {
					const firstCurrencyId = pairData?.first_currency.asset_id;
					const secondCurrencyId = pairData?.second_currency.asset_id;

					console.log(firstCurrencyId, secondCurrencyId);

					if (!(firstCurrencyId && secondCurrencyId)) {
						alertErr('Invalid transaction data received');
						return;
					}

					if (!connectedOrder) return;

					const leftDecimal = new Decimal(e.left);
					const priceDecimal = new Decimal(e.price);

					const params = {
						destinationAssetID: e.type === 'buy' ? secondCurrencyId : firstCurrencyId,
						destinationAssetAmount: notationToString(
							e.type === 'buy'
								? leftDecimal.mul(priceDecimal).toString()
								: leftDecimal.toString(),
						),
						currentAssetID: e.type === 'buy' ? firstCurrencyId : secondCurrencyId,
						currentAssetAmount: notationToString(
							e.type === 'buy'
								? leftDecimal.toString()
								: leftDecimal.mul(priceDecimal).toString(),
						),

						destinationAddress: e.user.address,
					};

					console.log(params);

					const createSwapResult = await ionicSwap(params);

					console.log(createSwapResult);

					const hex = createSwapResult?.data?.result?.hex_raw_proposal;

					if (createSwapResult?.data?.error?.code === -7) {
						alertErr('Insufficient funds');
						return;
					}
					if (!hex) {
						alertErr('Companion responded with an error');
						return;
					}

					result = await applyOrder({
						...e,
						hex_raw_proposal: hex,
					});
				}
			})();

			setApplyingState(false);

			if (!result) {
				return;
			}

			if (!(result as { success: boolean }).success) {
				alertErr('Server responded with an error');
				return;
			}

			await updateOrders();
			await updateUserOrders();
			await fetchUser();
			await fetchTrades();
		}

		return (
			<tr key={nanoid(16)}>
				<td>
					<p
						className={styles.alias}
						onMouseEnter={() => setShowTooltip(true)}
						onMouseLeave={() => setShowTooltip(false)}
					>
						@{cutAddress(e.user.alias, 12) || 'no alias'}
						<MatrixConnectionBadge
							userAdress={e.user.address}
							userAlias={e.user.alias}
						/>
						{e.isInstant && (
							<div style={{ marginLeft: 2 }}>
								<BadgeStatus icon />
							</div>
						)}
					</p>

					{(e.isInstant || e.transaction) && <BadgeStatus />}

					{e.user?.alias.length > 12 && (
						<Tooltip
							className={styles.table__tooltip_right}
							arrowClass={styles.table__tooltip_arrow}
							shown={showTooltip}
						>
							{e.user?.alias}
						</Tooltip>
					)}
				</td>

				<OrderRowTooltipCell style={{ color: e.type === 'buy' ? '#16D1D6' : '#FF6767' }}>
					{notationToString(e.price)}
				</OrderRowTooltipCell>
				<OrderRowTooltipCell>{notationToString(e.left)}</OrderRowTooltipCell>

				<OrderRowTooltipCell
					noTooltip
					style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
				>
					{notationToString(totalDecimal.toString())}{' '}
					<span>~ ${totalValue && formatDollarValue(totalValue)}</span>
				</OrderRowTooltipCell>

				<td></td>
				<td>
					<Link href="/" onClick={applyClick}>
						{applyingState ? 'Process' : 'Apply'}
					</Link>
				</td>
			</tr>
		);
	}

	const imgCode =
		pairData && tradingKnownCurrencies.includes(pairData.first_currency?.code)
			? pairData.first_currency?.code
			: 'tsds';

	const imgCode2 =
		pairData && tradingKnownCurrencies.includes(pairData.second_currency?.code)
			? pairData.second_currency?.code
			: 'tsds';

	const coefficient = pairStats?.coefficient || 0;
	const coefficientOutput =
		parseFloat(coefficient?.toFixed(2) || '0') === -100
			? -99.99
			: parseFloat(coefficient?.toFixed(2) || '0');

	const pairRateUsd =
		pairStats?.rate !== undefined && secondAssetUsdPrice !== undefined
			? new Decimal(pairStats.rate)
					.mul(secondAssetUsdPrice)
					.toFixed(pairStats.rate < 0.1 ? 6 : 2)
			: undefined;

	const scrollToOrderList = () => {
		if (!orderListRef.current) return;

		orderListRef.current.scrollIntoView({ behavior: 'smooth' });
	};

	const handleCancelAllOrders = async () => {
		setMyOrdersLoading(true);

		try {
			await Promise.all(userOrders.map((order) => cancelOrder(order.id)));
			await updateUserOrders();
		} catch (err) {
			console.error(err);
		} finally {
			setMyOrdersLoading(false);
		}
	};

	return (
		<>
			<Header isLg={true} />
			<main className={styles.main}>
				<div className={styles.trading__title__wrapper}>
					<div className={styles.trading__currency__wrapper}>
						<div className={styles.trading__currency__wrapper_top}>
							<div className={styles.coin__icon}>
								<Image
									width={50}
									height={50}
									src={`/currencies/trade_${imgCode}.svg`}
									alt="currency"
								/>
							</div>
							<div className={styles.coin__currency}>
								<p>
									{!(
										pairData &&
										pairData.first_currency?.name &&
										pairData.second_currency?.name
									) ? (
										'...'
									) : (
										<>
											{firstCurrencyName}
											<span>/{secondCurrencyName}</span>
										</>
									)}
								</p>
								<div className={styles.trading__currency__rate}>
									<p className={styles.trading__currency__rate_secondCurrency}>
										{notationToString(pairStats?.rate || 0)}{' '}
										{secondCurrencyName}
									</p>
									{pairRateUsd && (
										<p className={styles.trading__currency__rate_usd}>
											~ ${pairRateUsd}
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
					<div className={styles.currency__stats__wrapper}>
						{pairData && firstAssetLink && secondAssetLink && (
							<div className={styles.currency__stats__wrapper_assets}>
								<div className={styles.asset}>
									<p>
										<Image
											width={16}
											height={16}
											src={`/currencies/trade_${imgCode}.svg`}
											alt="currency"
										/>{' '}
										{firstCurrencyName}:
									</p>
									<Link
										rel="noopener noreferrer"
										target="_blank"
										href={firstAssetLink}
									>
										{shortenAddress(firstAssetId || '')}
									</Link>
								</div>
								<div className={styles.asset}>
									<p>
										<Image
											width={16}
											height={16}
											src={`/currencies/trade_${imgCode2}.svg`}
											alt="currency"
										/>{' '}
										{secondCurrencyName}:
									</p>
									<Link
										rel="noopener noreferrer"
										target="_blank"
										href={secondAssetLink}
									>
										{shortenAddress(firstAssetId || '')}
									</Link>
								</div>
							</div>
						)}

						<StatItem
							Img={ClockIcon}
							title="24h change"
							value={`${roundTo(notationToString(pairStats?.rate || 0), 8)} ${secondCurrencyName}`}
							coefficient={coefficientOutput}
						/>
						<StatItem
							Img={UpIcon}
							title="24h high"
							value={`${roundTo(notationToString(pairStats?.high || 0), 8)} ${secondCurrencyName}`}
						/>
						<StatItem
							Img={DownIcon}
							title="24h low"
							value={`${roundTo(notationToString(pairStats?.low || 0), 8)} ${secondCurrencyName}`}
						/>
						<StatItem
							Img={VolumeIcon}
							title="24h volume"
							value={`${roundTo(
								notationToString(pairStats?.volume || 0),
								8,
							)} ${secondCurrencyName}`}
						/>
					</div>

					<BackButton />
				</div>

				<div className={styles.trading__top__wrapper}>
					<div className={styles.trading__orders_panel}>
						<div className={styles.trading__orders_panel__header}>
							<h5 className={styles.trading__orders_panel__header_title}>
								Orders pool
							</h5>

							<div className={styles.trading__orders_panel__header_type}>
								<button
									onClick={() => setOrdersBuySell(buySellValues[0])}
									className={classes(
										styles.all,
										ordersBuySell.code === 'all' && styles.selected,
									)}
								></button>

								<button
									onClick={() => setOrdersBuySell(buySellValues[1])}
									className={classes(
										styles.buy,
										ordersBuySell.code === 'buy' && styles.selected,
									)}
								>
									B
								</button>

								<button
									onClick={() => setOrdersBuySell(buySellValues[2])}
									className={classes(
										styles.sell,
										ordersBuySell.code === 'sell' && styles.selected,
									)}
								>
									S
								</button>
							</div>
						</div>

						<div className={styles.orders__panel_content}>
							<table>
								<thead>
									<tr>
										<th>Price ({secondCurrencyName})</th>
										<th>Amount ({firstCurrencyName})</th>
										<th>Total ({secondCurrencyName})</th>
									</tr>
								</thead>

								{!ordersLoading && !!filteredOrdersHistory.length && (
									<tbody
										ref={ordersInfoRef}
										onMouseMove={moveInfoTooltip}
										onMouseLeave={() => setOrdersInfoTooltip(null)}
										className="orders-scroll"
									>
										{filteredOrdersHistory?.map((e) => {
											const maxValue = Math.max(
												...filteredOrdersHistory.map((order) =>
													parseFloat(String(order.left)),
												),
											);
											const percentage = (
												(parseFloat(String(e.left)) / maxValue) *
												100
											).toFixed(2);

											return (
												<OrdersRow
													orderData={e}
													percentage={Number(percentage)}
													key={nanoid(16)}
												/>
											);
										})}
									</tbody>
								)}
							</table>

							{!filteredOrdersHistory.length && !ordersLoading && (
								<div
									className={`${styles.orders__message} ${styles.all__orders__msg}`}
								>
									<NoOffersIcon />
									<h6>No orders</h6>
								</div>
							)}
							{ordersLoading && (
								<ContentPreloader className={styles.orders__preloader} />
							)}

							{ordersInfoTooltip &&
								(() => {
									const totalDecimal = new Decimal(ordersInfoTooltip?.left).mul(
										new Decimal(ordersInfoTooltip?.price),
									);
									const totalValue = secondAssetUsdPrice
										? totalDecimal.mul(secondAssetUsdPrice).toFixed(2)
										: undefined;

									return (
										<Tooltip
											key={nanoid(16)}
											className={styles.tooltip}
											arrowClass={styles.tooltip__arrow}
											style={{
												left: infoTooltipPos.x,
												top: infoTooltipPos.y + 20,
											}}
											shown
										>
											<div>
												<h6>Alias</h6>
												<p>
													@
													{cutAddress(
														ordersInfoTooltip?.user?.alias ||
															'no alias',
														12,
													)}{' '}
													{ordersInfoTooltip?.isInstant && (
														<BadgeStatus icon />
													)}
												</p>

												<h6>Price ({secondCurrencyName})</h6>
												<p
													style={{
														color:
															ordersInfoTooltip?.type === 'buy'
																? '#16D1D6'
																: '#FF6767',
													}}
												>
													{notationToString(ordersInfoTooltip?.price)}
												</p>
												<span>
													~
													{secondAssetUsdPrice &&
													ordersInfoTooltip?.price !== undefined
														? (() => {
																const total =
																	secondAssetUsdPrice *
																	ordersInfoTooltip.price;
																const formatted =
																	ordersInfoTooltip.price < 0.9
																		? `$${total.toFixed(5)}`
																		: `$${total.toFixed(2)}`;
																return formatted;
															})()
														: 'undefined'}
												</span>

												<h6>Amount ({firstCurrencyName})</h6>
												<p>{notationToString(ordersInfoTooltip?.amount)}</p>

												<h6>Total ({secondCurrencyName})</h6>
												<p>{notationToString(totalDecimal.toString())}</p>
												<span>
													~{' '}
													{totalValue
														? `$${formatDollarValue(totalValue)}`
														: 'undefined'}
												</span>
											</div>
										</Tooltip>
									);
								})()}
						</div>
					</div>

					<div className={styles.trading__chart__wrapper}>
						<div className={styles.trading__chart__settings}>
							<HorizontalSelect
								body={periods}
								value={periodsState}
								setValue={setPeriodsState}
								isTab
							/>
							<Dropdown
								body={[
									{ name: 'Zano Chart' },
									{ name: 'Trading View', disabled: true },
								]}
								className={styles.trading__chart__dropdown}
								selfContained
								value={{ name: 'Zano Chart' }}
								setValue={() => undefined}
							/>
						</div>

						{candlesLoaded ? (
							<CandleChart candles={candles} period={periodsState.code} />
						) : (
							<ContentPreloader className={styles.trading__chart__preloader} />
						)}
					</div>

					<div className={styles.allTrades}>
						<div className={styles.allTrades__header}>
							<button
								onClick={() => setTradesType('all')}
								className={classes(
									styles.navItem,
									tradesType === 'all' && styles.active,
								)}
							>
								All Trades
							</button>

							<button
								onClick={() => setTradesType('my')}
								className={classes(
									styles.navItem,
									tradesType === 'my' && styles.active,
								)}
							>
								My Trades
							</button>
						</div>

						<div className={styles.orders__panel_content}>
							<table>
								<thead>
									<tr>
										<th>Price ({secondCurrencyName})</th>
										<th>Amount ({firstCurrencyName})</th>
										<th>Time</th>
									</tr>
								</thead>

								{!tradesLoading && !!filteredTrades.length && (
									<tbody className="orders-scroll">
										{filteredTrades.map((trade) => (
											<tr key={trade.id}>
												<td>
													<p
														style={{
															color:
																trade.id % 2 === 0
																	? '#16D1D6'
																	: '#FF6767',
														}}
													>
														{trade.price}
													</p>
												</td>
												<td>
													<p>{trade.amount}</p>
												</td>
												<td>
													<p>{formatTime(trade.timestamp)}</p>
												</td>
											</tr>
										))}
									</tbody>
								)}
							</table>

							{!filteredTrades.length && !tradesLoading && (
								<div
									className={`${styles.orders__message} ${styles.all__orders__msg}`}
								>
									<NoOffersIcon />
									<h6>No trades</h6>
								</div>
							)}

							{tradesLoading && (
								<ContentPreloader className={styles.orders__preloader} />
							)}
						</div>
					</div>
				</div>

				<div className={styles.trading__info}>
					<div id="my_orders" ref={orderListRef} className={styles.trading__user__orders}>
						<div className={styles.trading__user__orders__header}>
							<div className={styles.trading__user__orders__header_nav}>
								<button
									onClick={() => setOrdersType('opened')}
									className={classes(
										styles.navItem,
										ordersType === 'opened' && styles.active,
									)}
								>
									Opened orders{' '}
									{applyTips?.length ? <span>{applyTips?.length}</span> : ''}
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
									className={styles.trading__user__orders__header_btn}
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
										<th>
											Price <br />({secondCurrencyName})
										</th>
										<th>
											Amount <br />({firstCurrencyName})
										</th>
										<th>
											Total <br />({secondCurrencyName})
										</th>
										<th>Offers</th>
										<th></th>
									</tr>
								</thead>
							</table>

							{!myOrdersLoading && loggedIn && !!userOrders.length && (
								<div className={`${styles.trading__right__tables} orders-scroll`}>
									<table>
										<tbody className={styles.stats__table__incoming}>
											{userOrders.map((e) => (
												<MyOrdersRow key={nanoid(16)} orderData={e} />
											))}
										</tbody>
									</table>
									{!!applyTips.length && (
										<table className={styles.trading__apply__table}>
											<tbody>
												{applyTips.map((e) => (
													<MyOrdersApplyRow
														key={nanoid(16)}
														orderData={e}
													/>
												))}
											</tbody>
										</table>
									)}
								</div>
							)}

							{myOrdersLoading && loggedIn && (
								<ContentPreloader
									className={`${styles.orders__message} ${styles.user__orders__msg}`}
								/>
							)}

							{!loggedIn && (
								<div
									className={`${styles.orders__message} ${styles.user__orders__msg}`}
								>
									<NoOffersIcon />
									<h6>Connect wallet to see your orders</h6>
								</div>
							)}

							{loggedIn && !userOrders.length && !myOrdersLoading && (
								<div
									className={`${styles.orders__message} ${styles.user__orders__msg}`}
								>
									<NoOffersIcon />
									<h6>No orders</h6>
								</div>
							)}
						</div>
					</div>

					<div ref={orderFormRef} className={styles.trading__info_createOrders}>
						<div className={styles.trading__info_createOrder}>
							<InputPanelItem
								priceState={priceState}
								amountState={amountState}
								totalState={totalState}
								buySellValues={buySellValues}
								buySellState={buySellValues[1]}
								setPriceFunction={setPriceFunction}
								setAmountFunction={setAmountFunction}
								setAlertState={setAlertState}
								setAlertSubtitle={setAlertSubtitle}
								setRangeInputValue={setRangeInputValue}
								rangeInputValue={rangeInputValue}
								firstCurrencyName={firstCurrencyName}
								secondCurrencyName={secondCurrencyName}
								balance={Number(balance)}
								priceValid={priceValid}
								amountValid={amountValid}
								totalValid={totalValid}
								totalUsd={totalUsd}
								scrollToOrderList={scrollToOrderList}
							/>
						</div>

						<div className={styles.trading__info_createOrder}>
							<InputPanelItem
								priceState={priceSellState}
								amountState={amountSellState}
								totalState={totalSellState}
								buySellValues={buySellValues}
								buySellState={buySellValues[2]}
								setPriceFunction={setPriceSellFunction}
								setAmountFunction={setAmountSellFunction}
								setAlertState={setAlertState}
								setAlertSubtitle={setAlertSubtitle}
								setRangeInputValue={setRangeInputSellValue}
								rangeInputValue={rangeInputSellValue}
								firstCurrencyName={firstCurrencyName}
								secondCurrencyName={secondCurrencyName}
								balance={Number(balance)}
								priceValid={priceSellValid}
								amountValid={amountSellValid}
								totalValid={totalSellValid}
								totalUsd={totalSellUsd}
								scrollToOrderList={scrollToOrderList}
							/>
						</div>
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
