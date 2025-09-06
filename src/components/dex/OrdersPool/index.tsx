import React, { useMemo, useRef, useState } from 'react';
import {
	classes,
	createOrderSorter,
	cutAddress,
	formatDollarValue,
	notationToString,
} from '@/utils/utils';
import { nanoid } from 'nanoid';
import Decimal from 'decimal.js';
import Tooltip from '@/components/UI/Tooltip/Tooltip';
import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import { buySellValues } from '@/constants';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import useMouseLeave from '@/hook/useMouseLeave';
import { tabsType } from '@/components/UI/Tabs/types';
import Tabs from '@/components/UI/Tabs';
import GenericTable from '@/components/default/GenericTable';
import styles from './styles.module.scss';
import BadgeStatus from '../BadgeStatus';
import { OrdersPoolProps } from './types';
import { buildOrderPoolColumns, buildTradesColumns } from './columns';

const tabsData: tabsType[] = [
	{
		title: 'Order Pool',
		type: 'orders',
	},
	{
		title: 'Recent Trades',
		type: 'trades',
	},
];

const OrdersPool = (props: OrdersPoolProps) => {
	const {
		ordersBuySell,
		OrdersHistory,
		setOrdersBuySell,
		currencyNames,
		ordersLoading,
		filteredOrdersHistory,
		secondAssetUsdPrice,
		takeOrderClick,
		trades,
		tradesLoading,
	} = props;
	const ordersInfoRef = useRef<HTMLTableSectionElement | null>(null);
	const { firstCurrencyName, secondCurrencyName } = currencyNames;
	const [infoTooltipPos, setInfoTooltipPos] = useState({ x: 0, y: 0 });
	const [ordersInfoTooltip, setOrdersInfoTooltip] = useState<PageOrderData | null>(null);
	const [currentOrder, setCurrentOrder] = useState<tabsType>(tabsData[0]);
	const { maxBuyLeftValue, maxSellLeftValue } = OrdersHistory.reduce(
		(acc, order) => {
			const left = parseFloat(String(order.left)) || 0;
			if (order.type === 'buy') acc.maxBuyLeftValue = Math.max(acc.maxBuyLeftValue, left);
			if (order.type === 'sell') acc.maxSellLeftValue = Math.max(acc.maxSellLeftValue, left);
			return acc;
		},
		{ maxBuyLeftValue: 0, maxSellLeftValue: 0 },
	);

	const totalLeft = maxBuyLeftValue + maxSellLeftValue;

	const moveInfoTooltip = (event: React.MouseEvent) => {
		setInfoTooltipPos({ x: event.clientX, y: event.clientY });
	};

	const ordersPool = useMemo(
		() =>
			buildOrderPoolColumns({
				firstCurrencyName,
				secondCurrencyName,
			}),
		[firstCurrencyName, secondCurrencyName],
	);

	const tradeOrders = useMemo(
		() =>
			buildTradesColumns({
				firstCurrencyName,
				secondCurrencyName,
			}),
		[firstCurrencyName, secondCurrencyName],
	);

	const sortedTrades = createOrderSorter<PageOrderData>({
		getPrice: (e) => e.price,
		getSide: (e) => e.type,
	});

	const renderTable = () => {
		switch (currentOrder.type) {
			case 'orders':
				return (
					<>
						{!ordersLoading ? (
							<div onMouseMove={moveInfoTooltip} ref={ordersInfoRef}>
								<GenericTable
									className={styles.ordersPool__content_orders}
									tableClassName={styles.table}
									tbodyClassName={styles.table__body}
									theadClassName={styles.table__header}
									columns={ordersPool}
									data={filteredOrdersHistory.sort(sortedTrades)}
									getRowKey={(r) => r.id}
									getRowProps={(row) => ({
										className: styles[row.type],
										style: {
											'--precentage': `${(
												(parseFloat(String(row.left)) /
													(row.type === 'buy'
														? maxBuyLeftValue
														: maxSellLeftValue)) *
												100
											).toFixed(2)}%`,
										} as React.CSSProperties,
										onClick: (event) => {
											takeOrderClick(event, row);
										},
										onMouseMove: (event) => {
											const tr = event.target as HTMLElement;
											if (tr.classList.contains('alias')) {
												setOrdersInfoTooltip(null);
											}
										},
										onMouseEnter: () => {
											setOrdersInfoTooltip(row);
										},
										onMouseLeave: () => {
											setOrdersInfoTooltip(null);
										},
									})}
									responsive={{
										query: '(max-width: 640px)',
										hiddenKeys: ['total'],
										alignOverride: { quantity: 'right' },
										tableLayout: 'auto',
									}}
								/>
							</div>
						) : (
							<ContentPreloader style={{ marginTop: 40 }} />
						)}
					</>
				);
			case 'trades':
				return (
					<>
						{!tradesLoading ? (
							<GenericTable
								className={classes(styles.ordersPool__content_orders, styles.full)}
								tableClassName={styles.table}
								tbodyClassName={styles.table__body}
								theadClassName={styles.table__header}
								columns={tradeOrders}
								data={trades.slice(0, 100)}
								getRowKey={(r) => r.id}
							/>
						) : (
							<ContentPreloader style={{ marginTop: 40 }} />
						)}
					</>
				);
			default:
				return null;
		}
	};

	useMouseLeave(ordersInfoRef, () => setOrdersInfoTooltip(null));
	return (
		<>
			<div data-tour="orders-pool" className={styles.ordersPool}>
				<div className={styles.ordersPool__header}>
					<Tabs value={currentOrder} setValue={setCurrentOrder} data={tabsData} />

					{currentOrder.type === 'orders' && (
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
					)}
				</div>

				<div className={styles.ordersPool__content}>
					{renderTable()}

					{currentOrder.type === 'orders' &&
						!ordersLoading &&
						totalLeft > 0 &&
						(() => {
							const buy = new Decimal(maxBuyLeftValue || 0);
							const sell = new Decimal(maxSellLeftValue || 0);
							const total = new Decimal(totalLeft);

							let buyPct = total.gt(0) ? buy.mul(100).div(total) : new Decimal(0);
							let sellPct = total.gt(0) ? sell.mul(100).div(total) : new Decimal(0);

							if (buy.isZero() && sell.gt(0)) {
								buyPct = new Decimal(0);
								sellPct = new Decimal(100);
							} else if (sell.isZero() && buy.gt(0)) {
								sellPct = new Decimal(0);
								buyPct = new Decimal(100);
							}

							const clamp = (d: Decimal) => Decimal.max(0, Decimal.min(100, d));

							const buyPctClamped = clamp(buyPct);
							const sellPctClamped = clamp(sellPct);

							const buyLabel = buyPctClamped
								.toDecimalPlaces(0, Decimal.ROUND_DOWN)
								.toString();
							const sellLabel = sellPctClamped
								.toDecimalPlaces(0, Decimal.ROUND_DOWN)
								.toString();

							return (
								<div className={styles.ordersPool__content_stats}>
									<div
										style={
											{
												'--width': `${buyPctClamped.toNumber()}%`,
											} as React.CSSProperties
										}
										className={classes(styles.stat_item, styles.buy)}
									>
										<div className={styles.stat_item__badge}>B</div> {buyLabel}%
									</div>
									<div
										style={
											{
												'--width': `${sellPctClamped.toNumber()}%`,
											} as React.CSSProperties
										}
										className={classes(styles.stat_item, styles.sell)}
									>
										{sellLabel}%{' '}
										<div className={styles.stat_item__badge}>S</div>
									</div>
								</div>
							);
						})()}
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
									{ordersInfoTooltip?.price}
								</p>
								<span>
									~
									{secondAssetUsdPrice && ordersInfoTooltip?.price !== undefined
										? (() => {
												const total = new Decimal(secondAssetUsdPrice).mul(
													ordersInfoTooltip.price,
												);

												if (total.abs().lt(0.01)) {
													return `$${total
														.toFixed(8)
														.replace(/(\.\d*?[1-9])0+$/, '$1')
														.replace(/\.0+$/, '')}`;
												}

												return `$${total.toFixed(2).replace(/\.0+$/, '')}`;
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
