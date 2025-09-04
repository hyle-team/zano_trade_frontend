import React from 'react';
import { classes, formatTimestamp, notationToString } from '@/utils/utils';
import { OrderGroupHeaderProps } from './types';
import styles from './styles.module.scss';

export default function OrderGroupHeader({
	order,
	firstCurrencyName,
	secondCurrencyName,
}: OrderGroupHeaderProps) {
	if (!order) return;

	return (
		<div className={classes(styles.header, styles[order.type])}>
			<div className={styles.header__item}>
				<p className={styles.header__label}>For order</p>

				<p className={classes(styles.header__value, styles.bold)}>
					{firstCurrencyName}/{secondCurrencyName}
				</p>

				<p className={styles.header__type}>{order.type}</p>
			</div>

			<div className={styles.header__item}>
				<p className={styles.header__label}>Quantity</p>

				<p className={styles.header__value}>
					{notationToString(order.amount)} {firstCurrencyName}
				</p>
			</div>

			<div className={styles.header__item}>
				<p className={styles.header__label}>Total</p>

				<p className={styles.header__value}>
					{notationToString(order.total)} {secondCurrencyName}
				</p>
			</div>

			<div className={styles.header__item}>
				<p className={styles.header__value}>{formatTimestamp(order.timestamp)}</p>
			</div>
		</div>
	);
}
