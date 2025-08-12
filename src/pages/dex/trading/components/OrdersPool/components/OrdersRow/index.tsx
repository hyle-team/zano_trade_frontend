import React from 'react';
import { classes, notationToString } from '@/utils/utils';
import { nanoid } from 'nanoid';
import Decimal from 'decimal.js';
import styles from './styles.module.scss';
import { OrdersRowProps } from './types';
import OrderRowTooltipCell from '../../../OrderRowTooltipCell';

function OrdersRow({
	orderData,
	percentage,
	takeOrderClick,
	setOrdersInfoTooltip,
}: OrdersRowProps) {
	const e = orderData || {};

	const totalDecimal = new Decimal(e.left).mul(new Decimal(e.price));

	return (
		<tr
			onMouseEnter={() => setOrdersInfoTooltip(e)}
			onClick={(event) => takeOrderClick(event, e)}
			className={classes(styles.row, e.type === 'sell' && styles.sell_section)}
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
			<OrderRowTooltipCell
				noTooltip
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

export default OrdersRow;
