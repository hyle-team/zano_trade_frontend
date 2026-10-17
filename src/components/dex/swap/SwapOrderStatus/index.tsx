import Decimal from 'decimal.js';
import Link from 'next/link';
import { ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';

import ConnectButton from '@/components/UI/ConnectButton/ConnectButton';
import Button from '@/components/UI/Button/Button';
import TokenIcon from '@/components/UI/TokenIcon';
import ConfirmModal from '@/components/UI/ConfirmModal';
import NotificationHelpModal from '@/components/dex/swap/NotificationHelpModal';
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	BellIcon,
	CheckIcon,
	ClockIcon,
	LightningIcon,
	MailIcon,
} from '@/components/UI/Icons';
import { getAdvancedModeHref } from '@/components/dex/swap/ModeSwitch';
import { Store } from '@/store/store-reducer';
import { useOrderActions } from '@/hook/useOrderActions';
import { getWalletErrorMessage } from '@/utils/walletErrors';
import { getUserOrders } from '@/utils/methods';
import { classes, formatTimestamp, shortenAddress, ZANO_ASSET_ID } from '@/utils/utils';
import { formatTokenAmount, getOrderSwapState, safeDecimal } from '@/utils/swap';
import { GetUserOrdersBodyStatus } from '@/interfaces/fetch-data/get-user-orders/GetUserOrdersData';
import PairData from '@/interfaces/common/PairData';
import OrderRow from '@/interfaces/common/OrderRow';
import ApplyTip from '@/interfaces/common/ApplyTip';
import UserPendingType from '@/interfaces/common/UserPendingType';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import Spinner from '@/components/UI/Spinner';
import styles from './styles.module.scss';

type OrderStatus =
	| 'loading'
	| 'waiting'
	| 'match'
	| 'requested'
	| 'proposal'
	| 'completed'
	| 'closed'
	| 'disconnected';

interface SwapOrderStatusProps {
	orderId: string;
	pairData: PairData | null;
	userOrders: OrderRow[];
	applyTips: ApplyTip[];
	pendings: UserPendingType[];
	orderBook: PageOrderData[];
	userDataLoaded: boolean;
	onBack: () => void;
	onRefresh: () => Promise<void>;
	onExpandedChange?: (_expanded: boolean) => void;
}

const MAX_MISS_ATTEMPTS = 2;

const STEPS = ['Order created', 'Match found', 'Swap proposal', 'Completed'];

const STEP_BY_STATUS: Record<OrderStatus, number> = {
	loading: 0,
	disconnected: 0,
	waiting: 0,
	match: 1,
	requested: 2,
	proposal: 2,
	completed: 3,
	closed: 0,
};

const SwapOrderStatus = ({
	orderId,
	pairData,
	userOrders,
	applyTips,
	pendings,
	orderBook,
	userDataLoaded,
	onBack,
	onRefresh,
	onExpandedChange,
}: SwapOrderStatusProps) => {
	const { state } = useContext(Store);
	const { acceptProposal, requestMatch, cancelOrder, cancelRequest, alertErr } =
		useOrderActions();

	const [snapshot, setSnapshot] = useState<OrderRow | null>(null);
	const [finishedState, setFinishedState] = useState<'completed' | 'closed' | null>(null);
	const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
	const [notificationHelpOpen, setNotificationHelpOpen] = useState(false);
	const [busyAction, setBusyAction] = useState<string | null>(null);
	const [notificationPermission, setNotificationPermission] = useState<
		NotificationPermission | 'unsupported'
	>('default');

	const cancelledByUserRef = useRef(false);
	const missAttemptsRef = useRef(0);

	const liveOrder = userOrders.find((o) => String(o.id) === String(orderId)) ?? null;
	const order = liveOrder ?? snapshot;

	useEffect(() => {
		if (liveOrder) {
			setSnapshot(liveOrder);
			setFinishedState(null);
		}
	}, [liveOrder]);

	useEffect(() => {
		setSnapshot(null);
		setFinishedState(null);
		cancelledByUserRef.current = false;
		missAttemptsRef.current = 0;
	}, [orderId]);

	useEffect(() => {
		if (!('Notification' in window)) {
			setNotificationPermission('unsupported');
			return undefined;
		}

		const refresh = () => setNotificationPermission(Notification.permission);
		refresh();

		let permissionStatus: PermissionStatus | null = null;

		navigator.permissions
			?.query({ name: 'notifications' as PermissionName })
			.then((status) => {
				permissionStatus = status;
				status.addEventListener('change', refresh);
			})
			.catch(() => undefined);

		window.addEventListener('focus', refresh);
		document.addEventListener('visibilitychange', refresh);

		return () => {
			permissionStatus?.removeEventListener('change', refresh);
			window.removeEventListener('focus', refresh);
			document.removeEventListener('visibilitychange', refresh);
		};
	}, []);

	useEffect(() => {
		if (notificationPermission === 'granted') setNotificationHelpOpen(false);
	}, [notificationPermission]);

	useEffect(() => {
		if (!userDataLoaded || liveOrder || finishedState || !state.token || !pairData) return;

		let cancelled = false;

		(async () => {
			const result = await getUserOrders(
				{
					limit: 50,
					offset: 0,
					filterInfo: {
						pairId: Number(pairData.id),
						status: GetUserOrdersBodyStatus.FINISHED,
					},
				},
				{ token: state.token },
			).catch(() => null);

			if (cancelled) return;

			if (cancelledByUserRef.current) {
				setFinishedState('closed');
				return;
			}

			const finished = result?.success
				? result.data.find((o) => String(o.id) === String(orderId))
				: undefined;

			if (finished) {
				setSnapshot((prev) => ({
					...(prev ?? (finished as unknown as OrderRow)),
					left: finished.left,
					status: finished.status,
				}));
				setFinishedState(
					safeDecimal(finished.left).lt(safeDecimal(finished.amount))
						? 'completed'
						: 'closed',
				);
			} else if (missAttemptsRef.current < MAX_MISS_ATTEMPTS) {
				missAttemptsRef.current += 1;
				await onRefresh();
			} else {
				setFinishedState('closed');
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [userDataLoaded, liveOrder, finishedState, userOrders, orderId, pairData?.id, state.token]);

	const swapState = order ? getOrderSwapState(order, applyTips, pendings) : null;
	const proposal = swapState?.proposal;
	const bestMatch = swapState?.bestMatch;
	const myRequest = swapState?.myRequest;

	const loggedIn = !!state.wallet?.connected && !!state.token;

	const status: OrderStatus = (() => {
		if (!loggedIn) return 'disconnected';
		if (finishedState) return finishedState;
		if (!order || !userDataLoaded || !swapState) return 'loading';
		return swapState.stage;
	})();

	const prevStatusRef = useRef<OrderStatus>(status);

	useEffect(() => {
		const prev = prevStatusRef.current;
		prevStatusRef.current = status;

		if (prev === status || (status !== 'match' && status !== 'proposal')) return;
		if (typeof document === 'undefined' || !document.hidden) return;
		if (!('Notification' in window) || Notification.permission !== 'granted') return;

		try {
			const notification = new Notification('Zano Trade', {
				body:
					status === 'match'
						? 'A counter order was found for your swap. Apply it to continue.'
						: 'You received a swap proposal. Accept it to complete the swap.',
				icon: '/favicon.ico',
			});

			notification.onclick = () => {
				window.focus();
				notification.close();
			};
		} catch (error) {
			console.error(error);
		}
	}, [status]);

	const requestPrice = useMemo(() => {
		if (!myRequest || !order) return null;
		const counterId = order.type === 'buy' ? myRequest.sell_order_id : myRequest.buy_order_id;
		return orderBook.find((o) => String(o.id) === String(counterId))?.price ?? null;
	}, [myRequest, order, orderBook]);

	const filledAmount = order ? safeDecimal(order.amount).minus(safeDecimal(order.left)) : null;
	const partiallyFilled = !!order && safeDecimal(order.left).gt(0) && !!filledAmount?.gt(0);

	const tokenTicker = pairData?.first_currency?.name || '';
	const tokenAssetId = pairData?.first_currency?.asset_id || '';
	const amountDP = pairData?.first_currency?.asset_info?.decimal_point ?? 12;
	const isBuy = order?.type === 'buy';

	const swapSides = (amount: Decimal.Value, price: Decimal.Value) => {
		const tokenAmount = safeDecimal(amount as string);
		const zanoAmount = tokenAmount.mul(safeDecimal(price as string));

		return isBuy
			? {
					pay: { amount: zanoAmount, ticker: 'ZANO', assetId: ZANO_ASSET_ID, dp: 8 },
					receive: {
						amount: tokenAmount,
						ticker: tokenTicker,
						assetId: tokenAssetId,
						dp: amountDP,
					},
				}
			: {
					pay: {
						amount: tokenAmount,
						ticker: tokenTicker,
						assetId: tokenAssetId,
						dp: amountDP,
					},
					receive: { amount: zanoAmount, ticker: 'ZANO', assetId: ZANO_ASSET_ID, dp: 8 },
				};
	};

	const filledPercent = useMemo(() => {
		if (!order) return 0;
		const amount = safeDecimal(order.amount);
		if (amount.isZero()) return 0;
		return amount.minus(safeDecimal(order.left)).div(amount).mul(100).toNumber();
	}, [order?.amount, order?.left]);

	async function runAction(key: string, action: () => Promise<boolean>) {
		if (busyAction) return;
		setBusyAction(key);

		try {
			const success = await action();
			if (success) await onRefresh();
		} catch (error) {
			console.error(error);
			alertErr(getWalletErrorMessage(error) ?? 'Something went wrong. Please try again.');
		} finally {
			setBusyAction(null);
		}
	}

	async function requestNotifications() {
		if (!('Notification' in window)) return;
		const permission = await Notification.requestPermission();
		setNotificationPermission(permission);
		if (permission === 'denied') setNotificationHelpOpen(true);
	}

	const renderSides = (amount: Decimal.Value, price: Decimal.Value, compact?: boolean) => {
		const sides = swapSides(amount, price);

		return (
			<div className={classes(styles.sides, compact && styles.sides__compact)}>
				{[sides.pay, sides.receive].map((side, index) => (
					<div key={index} className={styles.sides__item}>
						<p className={styles.sides__label}>
							{index === 0 ? 'You pay' : 'You receive'}
						</p>
						<div className={styles.sides__value}>
							<TokenIcon assetId={side.assetId} size={compact ? 20 : 24} />
							<p>
								{formatTokenAmount(side.amount, side.dp)} <span>{side.ticker}</span>
							</p>
						</div>
					</div>
				))}
			</div>
		);
	};

	const renderCounterparty = (alias?: string, address?: string, instant?: boolean) => (
		<div className={styles.counterparty}>
			<span className={styles.counterparty__avatar}>
				{(alias || address || '?').slice(0, 1).toUpperCase()}
			</span>
			<div>
				<p className={styles.counterparty__alias}>
					{alias ? `@${alias}` : shortenAddress(address || '')}
					{instant && (
						<span className={styles.instant}>
							<LightningIcon />
							Instant
						</span>
					)}
				</p>
				{address && (
					<p className={styles.counterparty__address}>{shortenAddress(address, 8, 6)}</p>
				)}
			</div>
		</div>
	);

	const renderNotifications = () => (
		<div className={styles.notify}>
			<p className={styles.notify__title}>Get notified when a match is found</p>

			<div className={styles.notify__row}>
				<span className={styles.notify__icon}>
					<BellIcon />
				</span>
				<div className={styles.notify__text}>
					<p>Browser notifications</p>
					<span>
						{notificationPermission === 'granted' && 'Enabled for this browser'}
						{notificationPermission === 'denied' && 'Blocked in your browser settings'}
						{notificationPermission === 'default' &&
							'We will ping you when it is your turn'}
						{notificationPermission === 'unsupported' &&
							'Not supported by this browser'}
					</span>
				</div>
				{notificationPermission === 'granted' ? (
					<span className={styles.notify__enabled}>
						<CheckIcon /> On
					</span>
				) : (
					<Button
						size="sm"
						variant="secondary"
						disabled={notificationPermission === 'unsupported'}
						onClick={() =>
							notificationPermission === 'denied'
								? setNotificationHelpOpen(true)
								: requestNotifications()
						}
					>
						{notificationPermission === 'denied' ? 'How to enable' : 'Enable'}
					</Button>
				)}
			</div>

			{/* <div className={classes(styles.notify__row, styles.notify__row_disabled)}>
				<span className={styles.notify__icon}>
					<MailIcon />
				</span>
				<div className={styles.notify__text}>
					<p>
						Email notifications <span className={styles.soon}>Soon</span>
					</p>
					<span>Receive an email when a counter order appears</span>
				</div>
				<Button size="sm" variant="secondary" disabled>
					Subscribe
				</Button>
			</div> */}
		</div>
	);

	const renderBody = (): ReactNode => {
		switch (status) {
			case 'disconnected':
				return (
					<div className={styles.state}>
						<h3 className={styles.state__title}>Connect your wallet</h3>
						<p className={styles.state__text}>
							Connect Zano Companion to see the status of this order and complete the
							swap.
						</p>
						<ConnectButton className={styles.connect} />
					</div>
				);

			case 'loading':
				return (
					<div className={styles.state}>
						<Spinner className={styles.spinner} />
						<p className={styles.state__text}>Loading order...</p>
					</div>
				);

			case 'proposal':
				if (!proposal) return null;
				return (
					<div className={styles.panel}>
						<div className={styles.panel__head}>
							<span className={classes(styles.badge, styles.badge__success)}>
								Action required
							</span>
							<h3>Swap proposal received</h3>
							<p>
								The counterparty has already sent the swap proposal. Accept it in
								your wallet to complete the swap.
							</p>
						</div>
						{renderCounterparty(
							proposal.user?.alias,
							proposal.user?.address,
							proposal.isInstant,
						)}
						{renderSides(proposal.left, proposal.price, true)}
						<Button
							variant="primary"
							block
							loading={busyAction === 'accept'}
							onClick={() => runAction('accept', () => acceptProposal(proposal))}
						>
							Accept swap
						</Button>
					</div>
				);

			case 'requested':
				if (!myRequest) return null;
				return (
					<div className={styles.panel}>
						<div className={styles.panel__head}>
							<span className={classes(styles.badge, styles.badge__info)}>
								<ClockIcon width={14} height={14} />
								Waiting for counterparty
							</span>
							<h3>Swap proposal sent</h3>
							<p>
								Your proposal was sent. The swap completes as soon as the
								counterparty confirms it in their wallet.
							</p>
						</div>
						{renderCounterparty(
							myRequest.finalizer?.alias,
							myRequest.finalizer?.address,
						)}
						{renderSides(myRequest.amount, requestPrice ?? myRequest.price, true)}
						<Button
							block
							variant="danger"
							loading={busyAction === 'cancel-request'}
							onClick={() =>
								runAction('cancel-request', () =>
									cancelRequest(String(myRequest.id)),
								)
							}
						>
							Cancel proposal
						</Button>
					</div>
				);

			case 'match':
				if (!bestMatch) return null;
				return (
					<div className={styles.panel}>
						<div className={styles.panel__head}>
							<span className={classes(styles.badge, styles.badge__success)}>
								Match found
							</span>
							<h3>Counter order is ready</h3>
							<p>
								Apply it to create the swap proposal in your wallet. The
								counterparty then confirms it and the swap completes.
							</p>
						</div>
						{renderCounterparty(
							bestMatch.user?.alias,
							bestMatch.user?.address,
							bestMatch.isInstant,
						)}
						{renderSides(bestMatch.left, bestMatch.price, true)}
						<div className={styles.panel__meta}>
							<p>Price</p>
							<p>
								1 {tokenTicker} = {formatTokenAmount(bestMatch.price, 8)} ZANO
							</p>
						</div>
						<Button
							variant="primary"
							block
							loading={busyAction === 'apply'}
							onClick={() =>
								runAction('apply', () => requestMatch(bestMatch, pairData))
							}
						>
							Apply
						</Button>
					</div>
				);

			case 'waiting':
				return (
					<>
						<div className={classes(styles.state, styles.state__waiting)}>
							<span className={styles.pulse}>
								<ClockIcon width={26} height={26} />
							</span>
							<h3 className={styles.state__title}>No counter orders yet</h3>
							<p className={styles.state__text}>
								Your order is open. You can wait here — we will show the match as
								soon as someone creates a suitable order. It stays active while you
								use Zano Trade and is cancelled 24 hours after you leave.
							</p>
						</div>
						{renderNotifications()}
					</>
				);

			case 'completed':
				return (
					<div className={styles.state}>
						<span className={classes(styles.pulse, styles.pulse__success)}>
							<CheckIcon width={26} height={26} />
						</span>
						<h3 className={styles.state__title}>
							{partiallyFilled ? 'Partially filled' : 'Swap completed'}
						</h3>
						<p className={styles.state__text}>
							{partiallyFilled
								? `${formatTokenAmount(filledAmount, amountDP)} ${tokenTicker} was swapped, the rest of the order was cancelled.`
								: 'The swap was confirmed. Funds will appear in your wallet after the transaction is confirmed on the blockchain.'}
						</p>
						<Button variant="primary" block onClick={onBack}>
							New swap
						</Button>
					</div>
				);

			case 'closed':
			default:
				return (
					<div className={styles.state}>
						<h3 className={styles.state__title}>Order is no longer active</h3>
						<p className={styles.state__text}>It was cancelled or removed.</p>
						<Button variant="primary" block onClick={onBack}>
							New swap
						</Button>
					</div>
				);
		}
	};

	const step = STEP_BY_STATUS[status];
	const isActive = !['completed', 'closed', 'loading', 'disconnected'].includes(status);
	const expanded = isActive && !!order;

	useEffect(() => {
		onExpandedChange?.(expanded);
	}, [expanded, onExpandedChange]);

	useEffect(() => () => onExpandedChange?.(false), [onExpandedChange]);

	const stepsNode = status !== 'closed' && status !== 'disconnected' && (
		<ol className={styles.steps}>
			{STEPS.map((label, index) => (
				<li
					key={label}
					className={classes(
						styles.step,
						(index < step || status === 'completed') && styles.step__done,
						index === step && status !== 'completed' && styles.step__current,
					)}
				>
					<span>
						{index < step || status === 'completed' ? (
							<CheckIcon width={12} height={12} />
						) : (
							index + 1
						)}
					</span>
					<p>{label}</p>
				</li>
			))}
		</ol>
	);

	return (
		<div className={styles.wrapper}>
			<div className={styles.head}>
				<button className={styles.back} onClick={onBack}>
					<ArrowLeftIcon />
					Go back
				</button>
				{order && <span className={styles.orderId}>Order #{order.id}</span>}
			</div>

			{order && (
				<div className={styles.summary}>
					{stepsNode && <div className={styles.summary__steps}>{stepsNode}</div>}
					<div className={styles.summary__top}>
						<span
							className={classes(
								styles.side,
								isBuy ? styles.side__buy : styles.side__sell,
							)}
						>
							{isBuy ? 'Buy' : 'Sell'} {tokenTicker}
						</span>
						<p className={styles.summary__time}>{formatTimestamp(order.timestamp)}</p>
					</div>
					{renderSides(order.left, order.price)}
					<div className={styles.summary__meta}>
						<p>
							Price: <span>{formatTokenAmount(order.price, 8)} ZANO</span>
						</p>
						<p>
							Filled: <span>{filledPercent.toFixed(filledPercent % 1 ? 2 : 0)}%</span>
						</p>
					</div>
					<div className={styles.progress}>
						<span style={{ width: `${Math.min(filledPercent, 100)}%` }} />
					</div>
					{isActive && (
						<div className={styles.footer}>
							<Button
								variant="danger"
								size="sm"
								loading={busyAction === 'cancel-order'}
								onClick={() => setConfirmCancelOpen(true)}
							>
								Cancel order
							</Button>
							{pairData && (
								<Link
									className={styles.footer__link}
									href={getAdvancedModeHref(pairData.id)}
								>
									Open in Advanced
								</Link>
							)}
						</div>
					)}
				</div>
			)}

			{!order && stepsNode}

			<div className={styles.body}>{renderBody()}</div>

			<NotificationHelpModal
				open={notificationHelpOpen}
				onClose={() => setNotificationHelpOpen(false)}
			/>

			<ConfirmModal
				open={confirmCancelOpen}
				title="Cancel order?"
				description="Your order will be removed. Pending swap proposals for it will be rejected."
				confirmLabel="Cancel order"
				cancelLabel="Keep"
				loading={busyAction === 'cancel-order'}
				onClose={() => setConfirmCancelOpen(false)}
				onConfirm={async () => {
					await runAction('cancel-order', async () => {
						const success = await cancelOrder(orderId);
						if (success) {
							cancelledByUserRef.current = true;
							setFinishedState('closed');
						}
						return success;
					});
					setConfirmCancelOpen(false);
				}}
			/>
		</div>
	);
};

export default SwapOrderStatus;
