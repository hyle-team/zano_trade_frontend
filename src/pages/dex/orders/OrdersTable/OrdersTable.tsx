import { nanoid } from 'nanoid';
import Button from '@/components/UI/Button/Button';
import DeleteIcon from '@/assets/images/UI/delete.svg';
import NoOffersIcon from '@/assets/images/UI/no_offers.svg';
import EmptyLink from '@/components/UI/EmptyLink/EmptyLink';
import { notationToString, toStandardDateString } from '@/utils/utils';
import OrdersTableProps from '@/interfaces/props/pages/dex/orders/OrdersTable/OrdersTableProps';
import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';
import Decimal from 'decimal.js';
import Tooltip from '@/components/UI/Tooltip/Tooltip';
import { useState } from 'react';
import styles from './OrdersTable.module.scss';

function OrdersTable(props: OrdersTableProps) {
	const orders = props.value || [];

	const { deleteOrder, category } = props;

	const isActive = category === 'active-orders';

	function Row(props: { orderData: UserOrderData }) {
		const { orderData } = props;

		const firstCurrencyName = orderData?.first_currency?.name || '';
		const secondCurrencyName = orderData?.second_currency?.name || '';

		const timestampDate = new Date(parseInt(orderData.timestamp, 10));

		const amount = (
			isActive
				? new Decimal(orderData.amount)
				: new Decimal(orderData.amount).minus(orderData.left)
		).toString();
		const total = (
			isActive
				? new Decimal(orderData.total)
				: new Decimal(orderData.amount).minus(orderData.left).mul(orderData.price)
		).toString();

		function CurrencyTableData({
			header,
			value,
			currency,
			price,
		}: {
			header: string;
			value: string;
			currency: string;
			price: string;
		}) {
			const [textHovered, setTextHovered] = useState(false);

			const displayText = `${value} ${currency}`;

			const needTooltip = displayText.length > 15;

			return (
				<td>
					<EmptyLink className={styles.table__header__mobile}>{header}</EmptyLink>
					<p
						onMouseEnter={() => setTextHovered(true)}
						onMouseLeave={() => setTextHovered(false)}
					>
						{displayText}

						<span className={styles.price}>~ ${price}</span>
					</p>
					{needTooltip && (
						<Tooltip className={styles.table__tooltip} shown={textHovered}>
							{displayText}
						</Tooltip>
					)}
				</td>
			);
		}

		return (
			<tr>
				<td>
					<div
						className={`${styles.type__marker} ${orderData.type === 'buy' ? styles.marker__buy : styles.marker__sell}`}
					>
						<h6>{orderData.type === 'buy' ? 'Buy' : 'Sell'}</h6>
					</div>
				</td>
				<td>
					<p>
						{toStandardDateString(timestampDate)}
						<br />
						{timestampDate.toLocaleTimeString('eu-EU')}
					</p>
				</td>
				<td>
					<EmptyLink className={styles.table__header__mobile}>Pair</EmptyLink>
					<p>
						{firstCurrencyName}/{secondCurrencyName}
					</p>
				</td>
				<td>
					<EmptyLink className={styles.table__header__mobile}>Side</EmptyLink>
					<p>{orderData.side === 'limit' ? 'Limit' : 'Market'}</p>
				</td>

				<CurrencyTableData
					price={notationToString(5.23)}
					header="Price"
					value={notationToString(orderData.price)}
					currency={secondCurrencyName}
				/>
				<CurrencyTableData
					price={notationToString(5.23)}
					header="Amount"
					value={notationToString(amount)}
					currency={firstCurrencyName}
				/>
				<CurrencyTableData
					price={notationToString(5.23)}
					header="Total"
					value={notationToString(total)}
					currency={secondCurrencyName}
				/>
				{isActive && (
					<td className={styles.table__delete}>
						<Button
							key={nanoid(16)}
							className={styles.delete__button}
							onClick={() => deleteOrder(orderData.id)}
						>
							<DeleteIcon />
						</Button>
					</td>
				)}
			</tr>
		);
	}

	return (
		<div>
			<table className={styles.table}>
				<thead>
					<tr>
						<th>
							<EmptyLink>Type</EmptyLink>
						</th>
						<th>
							<EmptyLink>Date</EmptyLink>
						</th>
						<th>
							<EmptyLink>Pairs</EmptyLink>
						</th>
						<th>
							<EmptyLink>Side</EmptyLink>
						</th>
						<th>
							<EmptyLink>Price</EmptyLink>
						</th>
						<th>
							<EmptyLink>Amount</EmptyLink>
						</th>
						<th>
							<EmptyLink>Total</EmptyLink>
						</th>
						{isActive && <th></th>}
					</tr>
				</thead>
				<tbody>
					{orders.map((e) => (
						<Row key={nanoid(16)} orderData={e} />
					))}
				</tbody>
			</table>

			{!orders.length && (
				<div className={styles.orders__table__message}>
					<NoOffersIcon />
					<p>No orders</p>
				</div>
			)}
		</div>
	);
}

export default OrdersTable;
