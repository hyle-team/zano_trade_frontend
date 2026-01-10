import { OrderDataWithPair } from '@/interfaces/responses/orders/GetOrdersPageRes';
import Button from '@/components/UI/Button/Button';
import { ReactComponent as CrossIcon } from '@/assets/images/UI/dex_cross_icon.svg';
import Image from 'next/image';
import { notationToString, tradingKnownCurrencies } from '@/utils/utils';
import Link from 'next/link';
import { Dispatch, SetStateAction } from 'react';
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
	const { pair } = order;
	const { first_currency, second_currency } = order.pair;
	const firstCurrencyTicker = first_currency.name;
	const secondCurrencyTicker = second_currency.name;
	const isBuy = order.type === 'buy';

	function onCloseClick() {
		setNotificationOrders((prev) => prev.filter((e, i) => i !== index));
	}

	const imgCode = tradingKnownCurrencies.includes(pair.first_currency?.code)
		? pair.first_currency?.code
		: 'tsds';

	const pairLink = `/dex/trading/${order.pair.id}#my_orders`;

	return (
		<div className={styles['dex__order-notification']}>
			<div className={styles['dex__order-notification_title']}>
				<h6>New Offer!</h6>
				<Button onClick={onCloseClick} transparent noBorder>
					<CrossIcon />
				</Button>
			</div>
			<div className={styles['dex__order-notification_pair']}>
				<Image
					width={20}
					height={20}
					src={`/currencies/trade_${imgCode}.svg`}
					alt="currency"
				/>
				<p>
					{firstCurrencyTicker}
					<span>/{secondCurrencyTicker}</span>
				</p>
				<div className={!isBuy ? styles['order-sell'] : undefined}>
					<p>{isBuy ? 'Buy' : 'Sell'}</p>
				</div>
			</div>
			<div className={styles['dex__order-notification_delimiter']} />
			<div className={styles['dex__order-notification_info']}>
				<div
					className={`${styles['dex__order-notification_info-item']} ${
						isBuy
							? styles['dex__order-notification_price-buy']
							: styles['dex__order-notification_price-sell']
					}`}
				>
					<p>Price</p>
					<p>{notationToString(order.price)}</p>
				</div>
			</div>
			<div className={styles['dex__order-notification_delimiter']} />
			<div className={styles['dex__order-notification_details']}>
				<Link href={pairLink} onClick={onCloseClick}>
					Details
				</Link>
			</div>
		</div>
	);
}
