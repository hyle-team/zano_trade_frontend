import { useRouter } from 'next/router';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import Header from '@/components/default/Header/Header';
import ConnectButton from '@/components/UI/ConnectButton/ConnectButton';
import Button from '@/components/UI/Button/Button';
import SegmentedTabs from '@/components/UI/SegmentedTabs';
import Select, { SelectOption } from '@/components/UI/Select';
import DateRangeSelector from '@/components/UI/DateRangeSelector/DateRangeSelector';
import DateState from '@/interfaces/common/DateState';
import TokenIcon from '@/components/UI/TokenIcon';
import { ArrowRightIcon, ClockIcon, SwapArrowsIcon } from '@/components/UI/Icons';
import { Store } from '@/store/store-reducer';
import { useOrderActions } from '@/hook/useOrderActions';
import socket from '@/utils/socket';
import {
	cancelAllOrders,
	getUserOrders,
	getUserOrdersAllPairs,
	getUserOrdersPage,
	getUserPendings,
} from '@/utils/methods';
import { classes, formatTimestamp } from '@/utils/utils';
import { figtree } from '@/utils/font';
import { OrderSwapStage, formatTokenAmount, getOrderSwapState, safeDecimal } from '@/utils/swap';
import {
	GetUserOrdersBodyStatus,
	GetUserOrdersBodyType,
} from '@/interfaces/fetch-data/get-user-orders/GetUserOrdersData';
import { CancelAllBodyOrderType } from '@/interfaces/fetch-data/cancel-all-orders/CancelAllData';
import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';
import { GetUserOrdersAllPairsResPair } from '@/interfaces/responses/orders/GetUserOrdersAllPairsRes';
import ApplyTip from '@/interfaces/common/ApplyTip';
import UserPendingType from '@/interfaces/common/UserPendingType';
import SiteFooter from '@/components/default/SiteFooter';
import { getDexOrderHref, useStoredDexMode } from '@/utils/dexMode';
import styles from '@/styles/Orders.module.scss';

type OrdersTab = 'active' | 'history';
type SideFilter = 'all' | 'buy' | 'sell';

const SIDE_OPTIONS: SelectOption<SideFilter>[] = [
	{ value: 'all', label: 'Buy & Sell' },
	{ value: 'buy', label: 'Buy' },
	{ value: 'sell', label: 'Sell' },
];

const HISTORY_PAGE_SIZE = 20;
const ACTIVE_LIMIT = 200;
const POLL_INTERVAL = 15e3;

const STAGE_META: Record<OrderSwapStage, { label: string; hint: string; tone: string }> = {
	proposal: {
		label: 'Proposal received',
		hint: 'The counterparty sent a swap proposal. Accept it to complete the swap.',
		tone: 'success',
	},
	requested: {
		label: 'Waiting for confirmation',
		hint: 'Your proposal was sent. The counterparty needs to confirm it.',
		tone: 'info',
	},
	match: {
		label: 'Match found',
		hint: 'A counter order is available. Apply it to start the swap.',
		tone: 'success',
	},
	waiting: {
		label: 'Waiting for match',
		hint: 'No counter orders yet.',
		tone: 'muted',
	},
};

const STAGE_PRIORITY: Record<OrderSwapStage, number> = {
	proposal: 0,
	match: 1,
	requested: 2,
	waiting: 3,
};

const STAGE_ACTION_LABEL: Record<OrderSwapStage, string> = {
	proposal: 'Accept',
	match: 'Apply',
	requested: 'Open',
	waiting: 'Open',
};

const SIDE_FILTER_TYPES = {
	buy: GetUserOrdersBodyType.BUY,
	sell: GetUserOrdersBodyType.SELL,
};

const CANCEL_SIDE_TYPES = {
	buy: CancelAllBodyOrderType.BUY,
	sell: CancelAllBodyOrderType.SELL,
};

function OrderSides({ order, amount }: { order: UserOrderData; amount: string | number }) {
	const ticker = order.first_currency?.name || order.pair?.first_currency?.name || '';
	const tokenAmount = safeDecimal(amount);
	const zanoAmount = tokenAmount.mul(safeDecimal(order.price));
	const isBuy = order.type === 'buy';

	const pay = isBuy
		? { value: zanoAmount, ticker: 'ZANO', assetId: order.second_currency?.asset_id }
		: { value: tokenAmount, ticker, assetId: order.first_currency?.asset_id };
	const receive = isBuy
		? { value: tokenAmount, ticker, assetId: order.first_currency?.asset_id }
		: { value: zanoAmount, ticker: 'ZANO', assetId: order.second_currency?.asset_id };

	return (
		<div className={styles.sides}>
			<div className={styles.sides__item}>
				<TokenIcon assetId={pay.assetId} size={22} />
				<p>
					{formatTokenAmount(pay.value, 6)} <span>{pay.ticker}</span>
				</p>
			</div>
			<ArrowRightIcon className={styles.sides__arrow} />
			<div className={styles.sides__item}>
				<TokenIcon assetId={receive.assetId} size={22} />
				<p>
					{formatTokenAmount(receive.value, 6)} <span>{receive.ticker}</span>
				</p>
			</div>
		</div>
	);
}

function Orders() {
	const router = useRouter();
	const { state } = useContext(Store);
	const { cancelOrder, alertErr } = useOrderActions();
	const loggedIn = !!state.wallet?.connected && !!state.token;

	const dexMode = useStoredDexMode();
	const [tab, setTab] = useState<OrdersTab>('active');
	const [sideFilter, setSideFilter] = useState<SideFilter>('all');
	const [pairFilter, setPairFilter] = useState('');

	const [activeOrders, setActiveOrders] = useState<UserOrderData[]>([]);
	const [applyTips, setApplyTips] = useState<ApplyTip[]>([]);
	const [pendings, setPendings] = useState<UserPendingType[]>([]);
	const [activeLoading, setActiveLoading] = useState(true);

	const [history, setHistory] = useState<UserOrderData[]>([]);
	const [historyTotal, setHistoryTotal] = useState<number | null>(null);
	const [historyLoading, setHistoryLoading] = useState(false);

	const [dateRange, setDateRange] = useState<DateState>({ first: null, last: null });
	const [userPairs, setUserPairs] = useState<GetUserOrdersAllPairsResPair[]>([]);
	const [cancellingId, setCancellingId] = useState<string | null>(null);
	const [cancellingAll, setCancellingAll] = useState(false);

	const tokenRef = useRef(state.token);
	tokenRef.current = state.token;

	const typeFilter = sideFilter === 'all' ? undefined : SIDE_FILTER_TYPES[sideFilter];

	const dateFilter = useMemo(() => {
		if (!dateRange.first || !dateRange.last) return undefined;

		const from = new Date(dateRange.first);
		const to = new Date(dateRange.last);

		from.setHours(0, 0, 0, 0);
		to.setHours(23, 59, 59, 999);

		return { from: from.getTime(), to: to.getTime() };
	}, [dateRange]);

	const loadActive = useCallback(async () => {
		const token = tokenRef.current;
		if (!token) return;

		const [ordersRes, pendingRes] = await Promise.all([
			getUserOrders(
				{
					limit: ACTIVE_LIMIT,
					offset: 0,
					filterInfo: { status: GetUserOrdersBodyStatus.ACTIVE },
				},
				{ token },
			).catch(() => null),
			getUserPendings({ token }).catch(() => null),
		]);

		if (!ordersRes?.success) {
			setActiveLoading(false);
			return;
		}

		const orders = ordersRes.data;
		const pairIds = Array.from(new Set(orders.map((o) => String(o.pair_id))));

		const pages = await Promise.all(
			pairIds.map((pairId) => getUserOrdersPage(pairId, { token }).catch(() => null)),
		);

		setActiveOrders(orders);
		setApplyTips(pages.flatMap((page) => (page?.success ? page.data.applyTips || [] : [])));
		if (pendingRes?.success) setPendings(pendingRes.data || []);
		setActiveLoading(false);
	}, []);

	const historyFetchIdRef = useRef(0);

	const loadHistory = useCallback(
		async (reset: boolean) => {
			const token = tokenRef.current;
			if (!token) return;

			historyFetchIdRef.current += 1;
			const fetchId = historyFetchIdRef.current;

			setHistoryLoading(true);

			const offset = reset ? 0 : history.length;
			const result = await getUserOrders(
				{
					limit: HISTORY_PAGE_SIZE,
					offset,
					filterInfo: {
						status: GetUserOrdersBodyStatus.FINISHED,
						type: typeFilter,
						pairId: pairFilter ? Number(pairFilter) : undefined,
						date: dateFilter,
					},
				},
				{ token },
			).catch(() => null);

			if (fetchId !== historyFetchIdRef.current) return;

			setHistoryLoading(false);

			if (!result?.success) {
				alertErr('Error loading orders history');
				return;
			}

			setHistory((prev) => (reset ? result.data : [...prev, ...result.data]));
			setHistoryTotal(result.totalItemsCount);
		},
		[history.length, typeFilter, pairFilter, dateFilter],
	);

	useEffect(() => {
		if (!loggedIn) return;

		setActiveLoading(true);
		loadActive();

		const interval = setInterval(loadActive, POLL_INTERVAL);
		return () => clearInterval(interval);
	}, [loggedIn, state.wallet?.address]);

	useEffect(() => {
		if (!loggedIn || tab !== 'history') return;
		setHistory([]);
		setHistoryTotal(null);
		loadHistory(true);
	}, [loggedIn, tab, sideFilter, pairFilter, dateFilter]);

	const activePairIds = useMemo(
		() => Array.from(new Set(activeOrders.map((o) => String(o.pair_id)))),
		[activeOrders],
	);

	useEffect(() => {
		if (!activePairIds.length) return;

		const onChange = () => {
			loadActive();
		};

		activePairIds.forEach((id) => socket.emit('in-trading', { id }));
		socket.on('update-orders', onChange);
		socket.on('delete-order', onChange);
		socket.on('new-order', onChange);

		return () => {
			activePairIds.forEach((id) => socket.emit('out-trading', { id }));
			socket.off('update-orders', onChange);
			socket.off('delete-order', onChange);
			socket.off('new-order', onChange);
		};
	}, [activePairIds.join(',')]);

	useEffect(() => {
		if (!loggedIn) return;

		getUserOrdersAllPairs({ token: state.token })
			.then((result) => {
				if (result.success) setUserPairs(result.data);
			})
			.catch(() => undefined);
	}, [loggedIn, state.wallet?.address]);

	const pairOptions = useMemo(() => {
		const assetIdByPair = new Map<string, string | undefined>();
		const names = new Map<string, string>();

		[...activeOrders, ...history].forEach((o) => {
			const ticker = o.first_currency?.name || o.pair?.first_currency?.name;
			assetIdByPair.set(String(o.pair_id), o.first_currency?.asset_id ?? undefined);
			if (ticker) names.set(String(o.pair_id), ticker);
		});

		userPairs.forEach((p) => {
			if (p.firstCurrency.ticker) names.set(String(p.id), p.firstCurrency.ticker);
		});

		const options: SelectOption<string>[] = [{ value: '', label: 'All assets' }];

		names.forEach((ticker, pairId) => {
			options.push({
				value: pairId,
				label: `${ticker}/ZANO`,
				icon: <TokenIcon assetId={assetIdByPair.get(pairId)} size={20} />,
			});
		});

		return options;
	}, [activeOrders, history, userPairs]);

	const visibleActive = useMemo(
		() =>
			activeOrders
				.filter((o) => sideFilter === 'all' || o.type === sideFilter)
				.filter((o) => !pairFilter || String(o.pair_id) === pairFilter)
				.filter(
					(o) =>
						!dateFilter ||
						(Number(o.timestamp) >= dateFilter.from &&
							Number(o.timestamp) <= dateFilter.to),
				)
				.map((order) => ({ order, ...getOrderSwapState(order, applyTips, pendings) }))
				.sort(
					(a, b) =>
						STAGE_PRIORITY[a.stage] - STAGE_PRIORITY[b.stage] ||
						Number(b.order.timestamp) - Number(a.order.timestamp),
				),
		[activeOrders, applyTips, pendings, sideFilter, pairFilter, dateFilter],
	);

	const actionRequiredCount = visibleActive.filter(
		(o) => o.stage === 'proposal' || o.stage === 'match',
	).length;

	async function onCancel(orderId: string) {
		setCancellingId(orderId);
		const success = await cancelOrder(orderId);
		if (success) {
			setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
			await loadActive();
		}
		setCancellingId(null);
	}

	async function onCancelAll() {
		setCancellingAll(true);

		const result = await cancelAllOrders(
			{
				filterInfo: {
					pairId: pairFilter ? Number(pairFilter) : undefined,
					type: sideFilter === 'all' ? undefined : CANCEL_SIDE_TYPES[sideFilter],
					date: dateFilter,
				},
			},
			{ token: state.token },
		).catch(() => null);

		if (!result?.success) alertErr('Error cancelling orders');

		await loadActive();
		setCancellingAll(false);
	}

	const { ref: historyEndRef, inView: historyEndInView } = useInView({ threshold: 0 });

	useEffect(() => {
		if (!historyEndInView || historyLoading || historyTotal === null) return;
		if (history.length >= historyTotal) return;
		loadHistory(false);
	}, [historyEndInView, historyLoading, historyTotal, history.length]);

	const renderActive = () => {
		if (activeLoading) return <div className={styles.loader} />;

		if (!visibleActive.length) {
			return (
				<div className={styles.empty}>
					<span className={styles.empty__icon}>
						<SwapArrowsIcon width={26} height={26} />
					</span>
					<h3>No active orders</h3>
					<p>Create a swap and it will appear here until it is completed.</p>
					<Button variant="primary" onClick={() => router.push('/dex')}>
						Start a swap
					</Button>
				</div>
			);
		}

		return (
			<div className={styles.list}>
				{visibleActive.map(({ order, stage, matchesCount }) => {
					const meta = STAGE_META[stage];
					const ticker = order.first_currency?.name || order.pair?.first_currency?.name;
					const amount = safeDecimal(order.amount);
					const filled = amount.isZero()
						? 0
						: amount.minus(safeDecimal(order.left)).div(amount).mul(100).toNumber();
					const actionRequired = stage === 'proposal' || stage === 'match';

					return (
						<div
							key={order.id}
							className={classes(
								styles.card,
								actionRequired && styles.card__highlight,
							)}
						>
							<div className={styles.card__top}>
								<div className={styles.card__title}>
									<span
										className={classes(
											styles.side,
											order.type === 'buy'
												? styles.side__buy
												: styles.side__sell,
										)}
									>
										{order.type === 'buy' ? 'Buy' : 'Sell'}
									</span>
									<p>{ticker}/ZANO</p>
								</div>
								<span
									className={classes(styles.stage, styles[`stage__${meta.tone}`])}
								>
									{stage === 'requested' && <ClockIcon width={13} height={13} />}
									{meta.label}
									{stage === 'match' && matchesCount > 1 && ` (${matchesCount})`}
								</span>
							</div>

							<OrderSides order={order} amount={order.left} />

							<div className={styles.card__meta}>
								<p>
									Price <span>{formatTokenAmount(order.price, 8)} ZANO</span>
								</p>
								<p>
									Filled <span>{filled.toFixed(filled % 1 ? 2 : 0)}%</span>
								</p>
								<p>
									Created <span>{formatTimestamp(order.timestamp)}</span>
								</p>
							</div>

							{filled > 0 && (
								<div className={styles.progress}>
									<span style={{ width: `${Math.min(filled, 100)}%` }} />
								</div>
							)}

							<div className={styles.card__bottom}>
								<p className={styles.card__hint}>{meta.hint}</p>
								<div className={styles.card__actions}>
									<Button
										size="sm"
										variant="ghost"
										loading={cancellingId === order.id}
										onClick={() => onCancel(order.id)}
									>
										Cancel
									</Button>
									<Button
										size="sm"
										variant={actionRequired ? 'primary' : 'secondary'}
										onClick={() =>
											router.push(
												getDexOrderHref(dexMode, order.pair_id, order.id),
											)
										}
									>
										{STAGE_ACTION_LABEL[stage]}
									</Button>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	const renderHistory = () => {
		if (!history.length && historyLoading) return <div className={styles.loader} />;

		if (!history.length) {
			return (
				<div className={styles.empty}>
					<h3>No finished orders yet</h3>
					<p>Completed and cancelled orders will be shown here.</p>
				</div>
			);
		}

		return (
			<div className={styles.list}>
				{history.map((order) => {
					const ticker = order.first_currency?.name || order.pair?.first_currency?.name;
					const filledAmount = safeDecimal(order.amount).minus(safeDecimal(order.left));
					const completed = safeDecimal(order.left).isZero();

					return (
						<div key={order.id} className={styles.card}>
							<div className={styles.card__top}>
								<div className={styles.card__title}>
									<span
										className={classes(
											styles.side,
											order.type === 'buy'
												? styles.side__buy
												: styles.side__sell,
										)}
									>
										{order.type === 'buy' ? 'Buy' : 'Sell'}
									</span>
									<p>{ticker}/ZANO</p>
								</div>
								<span
									className={classes(
										styles.stage,
										completed ? styles.stage__success : styles.stage__warning,
									)}
								>
									{completed ? 'Completed' : 'Partially filled'}
								</span>
							</div>

							<OrderSides order={order} amount={filledAmount.toFixed()} />

							<div className={styles.card__meta}>
								<p>
									Price <span>{formatTokenAmount(order.price, 8)} ZANO</span>
								</p>
								<p>
									Filled{' '}
									<span>
										{formatTokenAmount(filledAmount, 6)} /{' '}
										{formatTokenAmount(order.amount, 6)} {ticker}
									</span>
								</p>
								<p>
									Created <span>{formatTimestamp(order.timestamp)}</span>
								</p>
							</div>
						</div>
					);
				})}
				<div ref={historyEndRef}>{historyLoading && <div className={styles.loader} />}</div>
			</div>
		);
	};

	return (
		<>
			<Header />
			<main className={classes(styles.ordersPage, figtree.variable)}>
				<div className={styles.ordersPage__head}>
					<div>
						<h1>My Trade Orders</h1>
						<p>Check all the offers you have</p>
					</div>
				</div>

				{!loggedIn ? (
					<div className={styles.empty}>
						<h3>Connect your wallet</h3>
						<p>Connect Zano Companion to see your orders.</p>
						<ConnectButton className={styles.connect} />
					</div>
				) : (
					<>
						<div className={styles.toolbar}>
							<SegmentedTabs<OrdersTab>
								value={tab}
								onChange={setTab}
								tabs={[
									{
										value: 'active',
										label: (
											<>
												Active orders
												{actionRequiredCount > 0 && (
													<span className={styles.counter}>
														{actionRequiredCount}
													</span>
												)}
											</>
										),
									},
									{ value: 'history', label: 'Finished' },
								]}
							/>

							<div className={styles.toolbar__filters}>
								<Select<string>
									searchable
									searchPlaceholder="Search asset"
									emptyText="No assets found"
									options={pairOptions}
									value={pairFilter}
									onChange={setPairFilter}
								/>

								<Select<SideFilter>
									options={SIDE_OPTIONS}
									value={sideFilter}
									onChange={setSideFilter}
								/>

								<DateRangeSelector
									className={styles.dateFilter}
									value={dateRange}
									setValue={setDateRange}
								/>

								{tab === 'active' && visibleActive.length > 0 && (
									<Button
										className={styles.cancelBtn}
										size="sm"
										variant="danger"
										loading={cancellingAll}
										onClick={onCancelAll}
									>
										Cancel all
									</Button>
								)}
							</div>
						</div>

						<div key={tab} className={styles.content}>
							{tab === 'active' ? renderActive() : renderHistory()}
						</div>
					</>
				)}
			</main>
			<SiteFooter />
		</>
	);
}

export default Orders;
