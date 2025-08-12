import React, { useRef, useState } from 'react';
import { classes, cutAddress, formatDollarValue, notationToString } from '@/utils/utils';
import { nanoid } from 'nanoid';
import Decimal from 'decimal.js';
import Tooltip from '@/components/UI/Tooltip/Tooltip';
import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import { buySellValues } from '@/constants';
import EmptyMessage from '@/components/UI/EmptyMessage';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import useMouseLeave from '@/hook/useMouseLeave';
import OrdersRow from './components/OrdersRow';
import styles from './styles.module.scss';
import BadgeStatus from '../BadgeStatus';
import { OrdersPoolProps } from './types';

const OrdersPool = (props: OrdersPoolProps) => {
	const {
		ordersBuySell,
		setOrdersBuySell,
		currencyNames,
		ordersLoading,
		filteredOrdersHistory,
		secondAssetUsdPrice,
		takeOrderClick,
	} = props;
	const ordersInfoRef = useRef<HTMLTableSectionElement | null>(null);
	const { firstCurrencyName, secondCurrencyName } = currencyNames;
	const [infoTooltipPos, setInfoTooltipPos] = useState({ x: 0, y: 0 });
	const [ordersInfoTooltip, setOrdersInfoTooltip] = useState<PageOrderData | null>(null);

	const moveInfoTooltip = (event: React.MouseEvent) => {
		setInfoTooltipPos({ x: event.clientX, y: event.clientY });
	};

	useMouseLeave(ordersInfoRef, () => setOrdersInfoTooltip(null));
	return (
		<>
			<div className={styles.ordersPool}>
				<div className={styles.ordersPool__header}>
					<h5 className={styles.ordersPool__header_title}>Orders pool</h5>

					<div className={styles.ordersPool__header_type}>
						<button
							onClick={() => setOrdersBuySell(buySellValues[0])}
							className={classes(
								styles.btn,
								styles.all,
								ordersBuySell.code === 'all' && styles.selected,
							)}
						></button>

						<button
							onClick={() => setOrdersBuySell(buySellValues[1])}
							className={classes(
								styles.btn,
								styles.buy,
								ordersBuySell.code === 'buy' && styles.selected,
							)}
						>
							B
						</button>

						<button
							onClick={() => setOrdersBuySell(buySellValues[2])}
							className={classes(
								styles.btn,
								styles.sell,
								ordersBuySell.code === 'sell' && styles.selected,
							)}
						>
							S
						</button>
					</div>
				</div>

				<div className={styles.ordersPool__content}>
					<table>
						<thead>
							<tr>
								<th>Price ({secondCurrencyName})</th>
								<th>Amount ({firstCurrencyName})</th>
								<th>Total ({secondCurrencyName})</th>
							</tr>
						</thead>

						{!ordersLoading && !!filteredOrdersHistory.length && (
							<tbody
								ref={ordersInfoRef}
								onMouseMove={moveInfoTooltip}
								onMouseLeave={() => setOrdersInfoTooltip(null)}
								className="orders-scroll"
							>
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
											takeOrderClick={takeOrderClick}
											setOrdersInfoTooltip={setOrdersInfoTooltip}
										/>
									);
								})}
							</tbody>
						)}
					</table>

					{!filteredOrdersHistory.length && !ordersLoading && (
						<EmptyMessage text="No orders" />
					)}
					{ordersLoading && <ContentPreloader style={{ marginTop: 40 }} />}
				</div>
			</div>

			{/* Order tooltip */}
			{ordersInfoTooltip &&
				(() => {
					const totalDecimal = new Decimal(ordersInfoTooltip?.left).mul(
						new Decimal(ordersInfoTooltip?.price),
					);
					const totalValue = secondAssetUsdPrice
						? totalDecimal.mul(secondAssetUsdPrice).toFixed(2)
						: undefined;

					return (
						<Tooltip
							key={nanoid(16)}
							className={styles.tooltip}
							arrowClass={styles.tooltip__arrow}
							style={{
								left: infoTooltipPos.x,
								top: infoTooltipPos.y + 20,
							}}
							shown
						>
							<div>
								<h6>Alias</h6>
								<p>
									@{cutAddress(ordersInfoTooltip?.user?.alias || 'no alias', 12)}{' '}
									{ordersInfoTooltip?.isInstant && (
										<BadgeStatus type="instant" icon />
									)}
								</p>

								<h6>Price ({secondCurrencyName})</h6>
								<p
									style={{
										color:
											ordersInfoTooltip?.type === 'buy'
												? '#16D1D6'
												: '#FF6767',
									}}
								>
									{notationToString(ordersInfoTooltip?.price)}
								</p>
								<span>
									~
									{secondAssetUsdPrice && ordersInfoTooltip?.price !== undefined
										? (() => {
												const total =
													secondAssetUsdPrice * ordersInfoTooltip.price;
												const formatted =
													ordersInfoTooltip.price < 0.9
														? `$${total.toFixed(5)}`
														: `$${total.toFixed(2)}`;
												return formatted;
											})()
										: 'undefined'}
								</span>

								<h6>Amount ({firstCurrencyName})</h6>
								<p>{notationToString(ordersInfoTooltip?.amount)}</p>

								<h6>Total ({secondCurrencyName})</h6>
								<p>{notationToString(totalDecimal.toString())}</p>
								<span>
									~{' '}
									{totalValue ? `$${formatDollarValue(totalValue)}` : 'undefined'}
								</span>
							</div>
						</Tooltip>
					);
				})()}
		</>
	);
};

export default OrdersPool;
