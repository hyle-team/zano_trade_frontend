import styles from '@/styles/Trading.module.scss';
import Footer from '@/components/default/Footer/Footer';
import Header from '@/components/default/Header/Header';
import PageTitle from '@/components/default/PageTitle/PageTitle';
import { ReactComponent as ClockIcon } from '@/assets/images/UI/clock_icon.svg';
import { ReactComponent as UpIcon } from '@/assets/images/UI/up_icon.svg';
import { ReactComponent as DownIcon } from '@/assets/images/UI/down_icon.svg';
import { ReactComponent as VolumeIcon } from '@/assets/images/UI/volume_icon.svg';
import { ReactComponent as NoOffersIcon } from '@/assets/images/UI/no_offers.svg';
import { ReactComponent as ArrowRight } from '@/assets/images/UI/arrow-outlined-right.svg';
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
} from '@/utils/methods';
import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import {
	cutAddress,
	formatDollarValue,
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
import CandleChart from './CandleChart/CandleChart';
import OrdersBuySellSwitch from './OrdersBuySellSwitch/OrdersBuySellSwitch';
import InputPanelItem from './InputPanelItem/InputPanelItem';
import { validateTokensInput } from '../../../../shared/utils';

function BadgeStatus({ type = 'instant' }: { type?: 'instant' | 'high' }) {
	return (
		<div className={`${styles.badge} ${type === 'high' && styles.high}`}>
			<Image src={type === 'instant' ? LightningImg : RocketImg} alt="badge image" />
			<span>{type === 'instant' ? 'instant' : 'high volume'}</span>
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

	const [myOrdersLoading, setMyOrdersLoading] = useState(true);

	const [ordersBuySell, setOrdersBuySell] = useState(buySellValues[0]);

	const [pairStats, setPairStats] = useState<PairStats | null>(null);

	const [applyTips, setApplyTips] = useState<ApplyTip[]>([]);

	const [alertState, setAlertState] = useState<AlertType>(null);

	const [alertSubtitle, setAlertSubtitle] = useState<string>('');

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
		?.filter((e) => e.type === ordersBuySell.code)
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

	const [totalUsd, setTotalUsd] = useState<string | undefined>(undefined);

	const [priceValid, setPriceValid] = useState(false);
	const [amountValid, setAmountValid] = useState(false);
	const [totalValid, setTotalValid] = useState(false);

	const [buySellState, setBuySellState] = useState(buySellValues[0]);

	const [rangeInputValue, setRangeInputValue] = useState('50');

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

		const secondCurrencyDP = pairData?.second_currency.asset_info?.decimal_point || 12;

		const validationResult = validateTokensInput(inputValue, secondCurrencyDP);

		if (!validationResult.valid) {
			setTotalState('');
			setTotalValid(false);
			setPriceValid(false);
			return;
		}

		setPriceValid(true);

		if (!valueDecimal.isNaN() && !amountDecimal.isNaN() && amountState !== '') {
			const total = valueDecimal.mul(amountDecimal).toFixed();
			setTotalState(total);

			const totalValidationResult = validateTokensInput(total, secondCurrencyDP);

			setTotalValid(totalValidationResult.valid);
		} else {
			setTotalState('');
			setTotalValid(false);
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
			const total = value.mul(price).toFixed();
			setTotalState(total);

			const totalValidationResult = validateTokensInput(
				total,
				pairData?.second_currency.asset_info?.decimal_point || 12,
			);

			setTotalValid(totalValidationResult.valid);
		} else {
			setTotalState('');
			setTotalValid(false);
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

		const total = priceDecimal.mul(amountDecimal).toFixed();

		const totalValidationResult = validateTokensInput(
			total,
			pairData?.second_currency.asset_info?.decimal_point || 12,
		);

		setTotalValid(totalValidationResult.valid);
	}

	function StatItem(props: StatItemProps) {
		const { Img } = props;

		return (
			<div className={styles.trading__stat__item}>
				<div>
					<Img />
					<p>{props.title}</p>
				</div>
				<div>
					<p>{props.value}</p>
					{props.coefficient !== undefined && (
						<p
							className={
								props.coefficient >= 0
									? styles.coefficient__green
									: styles.coefficient__red
							}
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
		event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
		e: PageOrderData,
	) {
		event.preventDefault();
		setCorrespondingOrder(e.price, e.amount);
		setBuySellState(
			buySellValues.find((e) => e.code !== ordersBuySell.code) || buySellValues[0],
		);

		if (!orderFormRef.current) return;

		orderFormRef.current.scrollIntoView({ behavior: 'smooth' });
	}

	//* * FOR USAGE IN THIS PAGE TABLES ONLY */
	function OrderRowTooltipCell({
		style,
		children,
		sideText,
		sideTextColor,
	}: {
		style?: React.CSSProperties;
		children: string;
		sideText?: string;
		sideTextColor?: string;
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
				{isLongContent && (
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
		const totalValue = secondAssetUsdPrice
			? totalDecimal.mul(secondAssetUsdPrice).toFixed(2)
			: undefined;

		const [showTooltip, setShowTooltip] = useState(false);

		let sideText: string;

		if (!secondAssetUsdPrice) {
			sideText = 'undefined';
		} else {
			const value = secondAssetUsdPrice * e.price;
			sideText = e.price < 0.9 ? `$${value.toFixed(5)}` : `$${value.toFixed(2)}`;
		}

		return (
			<tr
				className={ordersBuySell.code === 'sell' ? styles.sell_section : ''}
				style={{ '--line-width': `${percentage}%` } as React.CSSProperties}
				key={nanoid(16)}
			>
				<td>
					<p
						className={styles.alias}
						onMouseEnter={() => setShowTooltip(true)}
						onMouseLeave={() => setShowTooltip(false)}
					>
						@{cutAddress(e.user?.alias || 'no alias', 12)}
						<MatrixConnectionBadge
							userAdress={e?.user?.address}
							userAlias={e.user?.alias}
						/>
					</p>
					{e.isInstant && <BadgeStatus />}
					{/* High volume */}
					{/* <BadgeStatus type="high" /> */}

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
				<OrderRowTooltipCell
					style={{
						color: e.type === 'buy' ? '#16D1D6' : '#FF6767',
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
						maxWidth: 'max-content',
					}}
					sideText={sideText}
					sideTextColor={e.type === 'buy' ? '#2C8688' : '#B49398'}
				>
					{notationToString(e.price)}
				</OrderRowTooltipCell>
				<OrderRowTooltipCell>{notationToString(e.amount)}</OrderRowTooltipCell>
				<OrderRowTooltipCell>{notationToString(e.left)}</OrderRowTooltipCell>
				<OrderRowTooltipCell
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
						maxWidth: 'max-content',
					}}
					sideText={totalValue ? `$${formatDollarValue(totalValue)}` : undefined}
				>
					{notationToString(totalDecimal.toString())}
				</OrderRowTooltipCell>
				{/* <td><p>{localeTimeLeft(now, parseInt(e.expiration_timestamp, 10))}</p></td> */}
				<td>
					<Link
						href="/"
						className={
							ordersBuySell.code === 'buy'
								? styles.orders_table__buy
								: styles.orders_table__sell
						}
						onClick={(event) => takeOrderClick(event, e)}
						style={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							width: '18px',
							height: '18px',
						}}
					>
						<ArrowRight style={{ fill: 'transparent' }} />
					</Link>

					<div className={styles.status_line}></div>
				</td>
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
				<td style={{ marginRight: '34px' }}>
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
					</p>
					{e.isInstant && <BadgeStatus />}
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
				<OrderRowTooltipCell>{notationToString(e.left)}</OrderRowTooltipCell>
				<OrderRowTooltipCell
					style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
					sideText={totalValue ? `$${formatDollarValue(totalValue)}` : undefined}
				>
					{notationToString(totalDecimal.toString())}
				</OrderRowTooltipCell>
				{/* <td>{localeTimeLeft(now, parseInt(e.expiration_timestamp, 10))}</td> */}
				<td>
					<p>
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
		}

		return (
			<tr key={nanoid(16)}>
				<td style={{ marginRight: '34px' }}>
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
					{/* High volume */}
					{/* <BadgeStatus type="high" /> */}
				</td>

				<OrderRowTooltipCell style={{ color: e.type === 'buy' ? '#16D1D6' : '#FF6767' }}>
					{notationToString(e.price)}
				</OrderRowTooltipCell>
				<OrderRowTooltipCell>{notationToString(e.left)}</OrderRowTooltipCell>
				<td></td>
				<OrderRowTooltipCell
					style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
					sideText={totalValue ? `$${formatDollarValue(totalValue)}` : undefined}
				>
					{notationToString(totalDecimal.toString())}
				</OrderRowTooltipCell>
				{/* <td>{localeTimeLeft(now, parseInt(e.expiration_timestamp, 10))}</td> */}
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

	const coefficient = pairStats?.coefficient || 0;
	const coefficientOutput =
		parseFloat(coefficient?.toFixed(2) || '0') === -100
			? -99.99
			: parseFloat(coefficient?.toFixed(2) || '0');

	const ordersIsBuy = ordersBuySell.code === 'buy';
	const shownOrdersAmount = filteredOrdersHistory.filter(
		(e) => (e.type === 'buy') === ordersIsBuy,
	).length;

	const ordersSummaryFunds = filteredOrdersHistory
		.reduce(
			(acc, e) => acc.add(new Decimal(e.left).mul(new Decimal(e.price)).toNumber()),
			new Decimal(0),
		)
		.toDP(5)
		.toFixed();

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

	return (
		<>
			<Header />
			<main className={styles.main}>
				<div className={styles.trading__title__wrapper}>
					<PageTitle>
						<div className={styles.trading__currency__wrapper}>
							<div className={styles.trading__currency__wrapper_top}>
								<div>
									<Image
										width={50}
										height={50}
										src={`/currencies/trade_${imgCode}.svg`}
										alt="currency"
									/>
								</div>
								<div>
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
										<p>
											{notationToString(pairStats?.rate || 0)}{' '}
											{secondCurrencyName}
										</p>
										{pairRateUsd && (
											<>
												<div />
												<p className={styles.trading__currency__rate_usd}>
													${pairRateUsd}
												</p>
											</>
										)}
									</div>
								</div>
							</div>
							{pairData && firstAssetLink && secondAssetLink && (
								<div className={styles.trading__currency__wrapper_bottom}>
									<p>
										{firstCurrencyName}:{' '}
										<Link
											rel="noopener noreferrer"
											target="_blank"
											href={firstAssetLink}
										>
											{shortenAddress(firstAssetId || '')}
										</Link>
									</p>
									<p>
										{secondCurrencyName}:{' '}
										<Link
											rel="noopener noreferrer"
											target="_blank"
											href={secondAssetLink}
										>
											{shortenAddress(secondAssetId || '')}
										</Link>
									</p>
								</div>
							)}
						</div>
					</PageTitle>
					<div className={styles.currency__stats__wrapper}>
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
				</div>

				<div ref={orderFormRef} className={styles.trading__top__wrapper}>
					<div>
						{InputPanelItem({
							priceState,
							amountState,
							totalState,
							buySellValues,
							buySellState,
							setBuySellState,
							setPriceFunction,
							setAmountFunction,
							setAlertState,
							setAlertSubtitle,
							setRangeInputValue,
							rangeInputValue,
							firstCurrencyName,
							secondCurrencyName,
							balance: Number(balance),
							priceValid,
							amountValid,
							totalValid,
							totalUsd,
							scrollToOrderList,
							updateUserOrders,
						})}
					</div>
					<div className={styles.trading__chart__wrapper}>
						<div className={styles.trading__chart__settings}>
							<HorizontalSelect
								body={periods}
								value={periodsState}
								setValue={setPeriodsState}
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
				</div>

				<div className={styles.trading__info}>
					<div className={styles.trading__orders_panel}>
						<div className={styles['orders-panel__header']}>
							<div className={styles['orders-panel__header_left']}>
								<div>
									<h5>
										{ordersBuySell.code === 'buy' ? 'Buy' : 'Sell'} Orders
										{/* <span>{firstCurrencyName && secondCurrencyName ? " - " + firstCurrencyName + "/" + secondCurrencyName : ""}</span> */}
									</h5>
									<div className={styles.header__delimiter}></div>
									<p>
										{firstCurrencyName && secondCurrencyName
											? `${firstCurrencyName}/${secondCurrencyName}`
											: ''}
									</p>
								</div>

								<div className={styles.header__stats}>
									<div
										className={
											ordersIsBuy
												? styles.header__orders_buy
												: styles.header__orders_sell
										}
									>
										<p>
											{shownOrdersAmount}{' '}
											{shownOrdersAmount === 1 ? 'order' : 'orders'}
										</p>
									</div>
									<div className={styles['header__summary-funds']}>
										<p>
											{ordersSummaryFunds} <span>{secondCurrencyName}</span>
										</p>
									</div>
								</div>
							</div>
							{/* <HorizontalSelect
                                body={buySellValues}
                                value={ordersBuySell}
                                setValue={setOrdersBuySell}
                            /> */}
							<OrdersBuySellSwitch
								body={buySellValues}
								value={ordersBuySell}
								setValue={setOrdersBuySell}
								className={styles['orders-panel__header__select']}
							/>
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
											Remaining <br />({firstCurrencyName})
										</th>
										<th>
											{' '}
											Total <br /> ({secondCurrencyName})
										</th>
										<th></th>
									</tr>
								</thead>
								{!ordersLoading && !!filteredOrdersHistory.length && (
									<tbody className="orders-scroll">
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
						</div>
					</div>
					<div id="my_orders" ref={orderListRef} className={styles.trading__user__orders}>
						<div>
							<h5>My Orders</h5>

							<div>
								<p>
									{applyTips?.length || 0} Offer
									{(applyTips?.length || 0) === 1 ? '' : 's'}
								</p>
							</div>
						</div>

						<div>
							<table>
								<thead>
									<tr>
										<th style={{ marginRight: '34px' }}>Alias</th>
										<th>
											Price <br />({secondCurrencyName})
										</th>
										<th>
											Amount <br />({firstCurrencyName})
										</th>
										<th>
											Remaining <br />({firstCurrencyName})
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
