import { OrderDataWithPair } from '@/interfaces/responses/orders/GetOrdersPageRes';
import Link from 'next/link';
import { Dispatch, SetStateAction } from 'react';
import TokenIcon from '@/components/UI/TokenIcon';
import { BellIcon, CloseIcon } from '@/components/UI/Icons';
import { classes } from '@/utils/utils';
import { figtree } from '@/utils/font';
import { formatTokenAmount } from '@/utils/swap';
import { getDexOrderHref, useStoredDexMode } from '@/utils/dexMode';
import styles from './OrderNotification.module.scss';

interface OrderNotificationProps {
	order: OrderDataWithPair;
	setNotificationOrders: Dispatch<SetStateAction<OrderDataWithPair[]>>;
	index: number;
}

export default function OrderNotification({
	order,
	setNotificationOrders,
	index,
}: OrderNotificationProps) {
	const { first_currency, second_currency } = order.pair;
	const firstCurrencyTicker = first_currency.name;
	const secondCurrencyTicker = second_currency.name;
	const isBuy = order.type === 'buy';
	const dexMode = useStoredDexMode();

	function onCloseClick() {
		setNotificationOrders((prev) => prev.filter((e, i) => i !== index));
	}

	const pairLink = getDexOrderHref(dexMode, order.pair.id);

	return (
		<div className={classes(styles.notification, figtree.variable)} role="status">
			<div className={styles.notification__head}>
				<span className={styles.notification__icon}>
					<BellIcon width={18} height={18} />
				</span>
				<div className={styles.notification__title}>
					<h3>New offer</h3>
					<p>A new order matches one of yours</p>
				</div>
				<button
					type="button"
					className={styles.notification__close}
					onClick={onCloseClick}
					aria-label="Close"
				>
					<CloseIcon width={14} height={14} />
				</button>
			</div>

			<div className={styles.notification__body}>
				<div className={styles.notification__pair}>
					<TokenIcon assetId={first_currency.asset_id} size={28} />
					<p>
						{firstCurrencyTicker}
						<span>/{secondCurrencyTicker}</span>
					</p>
					<span
						className={classes(
							styles.side,
							isBuy ? styles.side__buy : styles.side__sell,
						)}
					>
						{isBuy ? 'Buy' : 'Sell'}
					</span>
				</div>

				<div className={styles.notification__meta}>
					<p>
						Price
						<span>
							{formatTokenAmount(order.price, 8)} {secondCurrencyTicker}
						</span>
					</p>
					<p>
						Amount
						<span>
							{formatTokenAmount(order.left, 6)} {firstCurrencyTicker}
						</span>
					</p>
				</div>
			</div>

			<Link href={pairLink} onClick={onCloseClick} className={styles.notification__action}>
				View offer
			</Link>
		</div>
	);
}
