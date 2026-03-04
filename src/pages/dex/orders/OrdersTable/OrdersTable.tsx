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
import { useContext, useState } from 'react';
import { Store } from '@/store/store-reducer';
import styles from './OrdersTable.module.scss';

function OrdersTable(props: OrdersTableProps) {
	const orders = props.value || [];

	const { deleteOrder, category } = props;

	const isActive = category === 'active-orders';

	function Row(props: { orderData: UserOrderData }) {
		const { state } = useContext(Store);
		const { orderData } = props;

		const firstCurrencyName = orderData?.first_currency?.name || '';
		const secondCurrencyName = orderData?.second_currency?.name || '';

		const secondCurrencyId = orderData.second_currency.asset_id ?? undefined;

		const timestampDate = new Date(parseInt(orderData.timestamp, 10));

		const secondAssetUsdPriceNumber = secondCurrencyId
			? state.assetsRates.get(secondCurrencyId)
			: undefined;
		const secondAssetUsdPrice = secondAssetUsdPriceNumber
			? new Decimal(secondAssetUsdPriceNumber)
			: undefined;

		const pairRateNumber = orderData.pair.rate;
		const pairRate = pairRateNumber !== undefined ? new Decimal(pairRateNumber) : undefined;

		const firstCurrencyUsdPrice =
			pairRate && secondAssetUsdPrice ? pairRate.mul(secondAssetUsdPrice) : undefined;

		const actualAmount = isActive
			? new Decimal(orderData.amount)
			: new Decimal(orderData.amount).minus(orderData.left);

		const actualTotal = isActive
			? new Decimal(orderData.total)
			: new Decimal(orderData.amount).minus(orderData.left).mul(orderData.price);

		const amountUSD = firstCurrencyUsdPrice
			? firstCurrencyUsdPrice.mul(actualAmount)
			: undefined;
		const priceUSD = secondAssetUsdPrice ? secondAssetUsdPrice.mul(orderData.price) : undefined;
		const totalUSD = secondAssetUsdPrice ? secondAssetUsdPrice.mul(actualTotal) : undefined;

		const amountPresentation: string = notationToString(actualAmount.toFixed());
		const pricePresentation: string = notationToString(orderData.price);
		const totalPresentation: string = notationToString(actualTotal.toFixed());

		const amountUSDPresentation: string = amountUSD ? amountUSD.toFixed(2) : 'N/A';
		const priceUSDPresentation: string = priceUSD ? priceUSD.toFixed(2) : 'N/A';
		const totalUSDPresentation: string = totalUSD ? totalUSD.toFixed(2) : 'N/A';

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
					price={priceUSDPresentation}
					header="Price"
					value={pricePresentation}
					currency={secondCurrencyName}
				/>
				<CurrencyTableData
					price={amountUSDPresentation}
					header="Amount"
					value={amountPresentation}
					currency={firstCurrencyName}
				/>
				<CurrencyTableData
					price={totalUSDPresentation}
					header="Total"
					value={totalPresentation}
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
