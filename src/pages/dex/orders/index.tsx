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
import ConfirmModal from '@/components/UI/ConfirmModal';
import { Switch } from '@/components/UI/Switch/Switch';
import { ArrowRightIcon, SwapArrowsIcon } from '@/components/UI/Icons';
import { Store } from '@/store/store-reducer';
import { useOrderActions } from '@/hook/useOrderActions';
import { cancelAllOrders, getMyOrdersPage } from '@/utils/methods';
import { classes, formatTimestamp } from '@/utils/utils';
import { figtree } from '@/utils/font';
import { formatTokenAmount, safeDecimal } from '@/utils/swap';
import {
	GetUserOrdersBodyStatus,
	GetUserOrdersBodyType,
} from '@/interfaces/fetch-data/get-user-orders/GetUserOrdersData';
import { CancelAllBodyOrderType } from '@/interfaces/fetch-data/cancel-all-orders/CancelAllData';
import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';
import SiteFooter from '@/components/default/SiteFooter';
import { setStoredDexMode } from '@/utils/dexMode';
import styles from '@/styles/Orders.module.scss';
import Spinner from '@/components/UI/Spinner';

type OrdersTab = 'active' | 'history';
type SideFilter = 'all' | 'buy' | 'sell';

const SIDE_OPTIONS: SelectOption<SideFilter>[] = [
	{ value: 'all', label: 'Buy & Sell' },
	{ value: 'buy', label: 'Buy' },
	{ value: 'sell', label: 'Sell' },
];

const INACTIVE_META = {
	label: 'Inactive',
	hint: 'Paused after 24 hours without visiting Zano Trade. Turn it on to make it visible to other traders again.',
};

const ACTIVE_META = {
	label: 'Active',
	hint: 'Open the order to see matches and swap proposals.',
	tone: 'muted',
};

const PAGE_SIZE = 20;

type KnownPair = { ticker: string; assetId?: string };

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

	const [tab, setTab] = useState<OrdersTab>('active');
	const [sideFilter, setSideFilter] = useState<SideFilter>('all');
	const [pairFilter, setPairFilter] = useState('');

	const [orders, setOrders] = useState<UserOrderData[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [knownPairs, setKnownPairs] = useState<Map<string, KnownPair>>(new Map());

	const [dateRange, setDateRange] = useState<DateState>({ first: null, last: null });
	const [cancellingId, setCancellingId] = useState<string | null>(null);
	const [cancellingAll, setCancellingAll] = useState(false);
	const [confirmCancel, setConfirmCancel] = useState<
		{ type: 'one'; order: UserOrderData } | { type: 'all' } | null
	>(null);

	const requestIdRef = useRef(0);

	const typeFilter = sideFilter === 'all' ? undefined : SIDE_FILTER_TYPES[sideFilter];

	const dateFilter = useMemo(() => {
		if (!dateRange.first || !dateRange.last) return undefined;

		const from = new Date(dateRange.first);
		const to = new Date(dateRange.last);

		from.setHours(0, 0, 0, 0);
		to.setHours(23, 59, 59, 999);

		return { from: from.getTime(), to: to.getTime() };
	}, [dateRange]);

	const loadPage = useCallback(
		async (cursor: string | null) => {
			if (!state.token) return;

			requestIdRef.current += 1;
			const requestId = requestIdRef.current;

			setLoading(true);

			const result = await getMyOrdersPage(
				{
					status:
						tab === 'active'
							? GetUserOrdersBodyStatus.ACTIVE
							: GetUserOrdersBodyStatus.FINISHED,
					type: typeFilter,
					pairId: pairFilter || undefined,
					date: dateFilter,
				},
				cursor,
				PAGE_SIZE,
				{ token: state.token },
			).catch(() => null);

			if (requestId !== requestIdRef.current) return;

			setLoading(false);

			if (!result?.success) {
				alertErr('Error loading orders');
				return;
			}

			const { items } = result.data;

			setOrders((prev) => (cursor === null ? items : [...prev, ...items]));
			setNextCursor(result.data.nextCursor);
			setKnownPairs((prev) => {
				const next = new Map(prev);
				items.forEach((o) => {
					const ticker = o.first_currency?.name || o.pair?.first_currency?.name;
					if (ticker) {
						next.set(String(o.pair_id), {
							ticker,
							assetId: o.first_currency?.asset_id ?? undefined,
						});
					}
				});
				return next.size === prev.size ? prev : next;
			});
		},
		[state.token, tab, typeFilter, pairFilter, dateFilter],
	);

	useEffect(() => {
		if (!loggedIn) return;

		setOrders([]);
		setNextCursor(null);
		loadPage(null);
	}, [loggedIn, loadPage]);

	const pairOptions = useMemo(() => {
		const options: SelectOption<string>[] = [{ value: '', label: 'All assets' }];

		knownPairs.forEach(({ ticker, assetId }, pairId) => {
			options.push({
				value: pairId,
				label: `${ticker}/ZANO`,
				icon: <TokenIcon assetId={assetId} size={20} />,
			});
		});

		return options;
	}, [knownPairs]);

	async function onCancel(orderId: string) {
		setCancellingId(orderId);
		const success = await cancelOrder(orderId);
		if (success) setOrders((prev) => prev.filter((o) => o.id !== orderId));
		setCancellingId(null);
	}

	async function onConfirmCancel() {
		if (!confirmCancel) return;

		if (confirmCancel.type === 'all') {
			await onCancelAll();
		} else {
			await onCancel(confirmCancel.order.id);
		}

		setConfirmCancel(null);
	}

	async function onCancelAll() {
		setCancellingAll(true);

		const result = await cancelAllOrders(
			{
				filterInfo: {
					pairId: pairFilter || undefined,
					type: sideFilter === 'all' ? undefined : CANCEL_SIDE_TYPES[sideFilter],
					date: dateFilter,
				},
			},
			{ token: state.token },
		).catch(() => null);

		if (!result?.success) alertErr('Error cancelling orders');

		await loadPage(null);
		setCancellingAll(false);
	}

	const { ref: listEndRef, inView: listEndInView } = useInView({ threshold: 0 });

	useEffect(() => {
		if (!listEndInView || loading || nextCursor === null) return;
		loadPage(nextCursor);
	}, [listEndInView, loading, nextCursor]);

	const renderListEnd = () => (
		<div ref={listEndRef}>
			{loading && (
				<div className={styles.loader}>
					<Spinner />
				</div>
			)}
		</div>
	);

	const renderActive = () => {
		if (!orders.length && loading) {
			return (
				<div className={styles.loader}>
					<Spinner />
				</div>
			);
		}

		if (!orders.length) {
			return (
				<div className={styles.empty}>
					<span className={styles.empty__icon}>
						<SwapArrowsIcon width={26} height={26} />
					</span>
					<h3>No active orders</h3>
					<p>You don&apos;t have any active swap orders yet.</p>
					<Button variant="primary" onClick={() => router.push('/dex')}>
						New swap
					</Button>
				</div>
			);
		}

		return (
			<div className={styles.list}>
				{orders.map((order) => {
					const isInactive = order.status === 'inactive';
					const meta = isInactive ? { ...INACTIVE_META, tone: 'warning' } : ACTIVE_META;
					const ticker = order.first_currency?.name || order.pair?.first_currency?.name;
					const amount = safeDecimal(order.amount);
					const filled = amount.isZero()
						? 0
						: amount.minus(safeDecimal(order.left)).div(amount).mul(100).toNumber();

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
									className={classes(styles.stage, styles[`stage__${meta.tone}`])}
								>
									{meta.label}
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
								<div className={styles.card__info}>
									<p className={styles.card__hint}>{meta.hint}</p>
									<button
										type="button"
										className={styles.card__advanced}
										onClick={() => {
											setStoredDexMode('advanced');
											router.push(`/dex/trading/${order.pair_id}`);
										}}
									>
										Open in Advanced Mode
										<ArrowRightIcon width={14} height={14} />
									</button>
								</div>
								<div className={styles.card__actions}>
									<label
										className={classes(styles.toggle, styles.toggle__disabled)}
									>
										<Switch
											checked={!isInactive}
											disabled={true}
											onChange={() => undefined}
										/>
										<span>{isInactive ? 'Off' : 'On'}</span>
									</label>

									<Button
										size="sm"
										variant="ghost"
										loading={cancellingId === order.id}
										onClick={() => setConfirmCancel({ type: 'one', order })}
									>
										Cancel
									</Button>
									<Button
										size="sm"
										variant="secondary"
										onClick={() =>
											router.push(
												`/dex?pair=${order.pair_id}&order=${order.id}`,
											)
										}
									>
										Open
									</Button>
								</div>
							</div>
						</div>
					);
				})}
				{renderListEnd()}
			</div>
		);
	};

	const renderHistory = () => {
		if (!orders.length && loading) {
			return (
				<div className={styles.loader}>
					<Spinner />
				</div>
			);
		}

		if (!orders.length) {
			return (
				<div className={styles.empty}>
					<h3>No finished orders</h3>
					<p>Completed and cancelled orders will be shown here.</p>
				</div>
			);
		}

		return (
			<div className={styles.list}>
				{orders.map((order) => {
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
				{renderListEnd()}
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
										label: 'Active orders',
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

								{tab === 'active' && orders.length > 0 && (
									<Button
										className={styles.cancelBtn}
										size="sm"
										variant="danger"
										loading={cancellingAll}
										onClick={() => setConfirmCancel({ type: 'all' })}
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

			<ConfirmModal
				open={!!confirmCancel}
				title={confirmCancel?.type === 'all' ? 'Cancel all orders?' : 'Cancel order?'}
				description={
					confirmCancel?.type === 'one'
						? `Your ${confirmCancel.order.type} order for ${formatTokenAmount(
								confirmCancel.order.left,
								6,
							)} ${
								confirmCancel.order.first_currency?.name ||
								confirmCancel.order.pair?.first_currency?.name ||
								''
							} will be removed. Pending swap proposals for it will be rejected.`
						: 'All active orders that match the current filters will be removed. Pending swap proposals for them will be rejected.'
				}
				confirmLabel={confirmCancel?.type === 'all' ? 'Cancel all' : 'Cancel order'}
				cancelLabel="Keep"
				loading={
					confirmCancel?.type === 'all'
						? cancellingAll
						: !!confirmCancel && cancellingId === confirmCancel.order.id
				}
				onConfirm={onConfirmCancel}
				onClose={() => setConfirmCancel(null)}
			/>
		</>
	);
}

export default Orders;
