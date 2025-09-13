import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
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
		setOrdersBuySell,
		currencyNames,
		ordersLoading,
		ordersHistory,
		filteredOrdersHistory,
		secondAssetUsdPrice,
		takeOrderClick,
		trades,
		tradesLoading,
	} = props;
	const ordersInfoRef = useRef<HTMLTableSectionElement>(null);
	const scrollRef = useRef<HTMLTableSectionElement>(null);
	const ordersMiddleRef = useRef<HTMLDivElement>(null);
	const { firstCurrencyName, secondCurrencyName } = currencyNames;
	const [infoTooltipPos, setInfoTooltipPos] = useState({ x: 0, y: 0 });
	const [ordersInfoTooltip, setOrdersInfoTooltip] = useState<PageOrderData | null>(null);
	const [currentOrder, setCurrentOrder] = useState<tabsType>(tabsData[0]);

	const totals = useMemo(() => {
		let buyTotal = new Decimal(0);
		let sellTotal = new Decimal(0);
		let maxBuyRow = new Decimal(0);
		let maxSellRow = new Decimal(0);

		for (const o of ordersHistory) {
			const qty = new Decimal(o.amount || 0);
			const price = new Decimal(o.price || 0);
			const rowTotal = qty.mul(price);

			if (o.type === 'buy') {
				buyTotal = buyTotal.plus(rowTotal);
				if (rowTotal.gt(maxBuyRow)) maxBuyRow = rowTotal;
			} else if (o.type === 'sell') {
				sellTotal = sellTotal.plus(rowTotal);
				if (rowTotal.gt(maxSellRow)) maxSellRow = rowTotal;
			}
		}

		const totalZano = buyTotal.plus(sellTotal);
		const pct = (part: Decimal, whole: Decimal) =>
			whole.gt(0) ? part.mul(100).div(whole) : new Decimal(0);

		const buyPct = pct(buyTotal, totalZano);
		const sellPct = pct(sellTotal, totalZano);

		return {
			buyTotal,
			sellTotal,
			totalZano,
			buyPct,
			sellPct,
			maxBuyRow,
			maxSellRow,
		};
	}, [ordersHistory]);

	const toDisplayPair = (buyPctDec: Decimal, sellPctDec: Decimal) => {
		const MIN_DISPLAY_PCT = 1;
		const buyRaw = buyPctDec.toNumber();
		const sellRaw = sellPctDec.toNumber();

		if (!Number.isFinite(buyRaw) || !Number.isFinite(sellRaw)) return { buy: 0, sell: 0 };

		if (buyRaw === 0 && sellRaw === 0) return { buy: 0, sell: 0 };
		if (buyRaw === 0) return { buy: 0, sell: 100 };
		if (sellRaw === 0) return { buy: 100, sell: 0 };

		let buyDisp = Math.floor(buyRaw);
		let sellDisp = Math.floor(sellRaw);

		if (buyDisp < MIN_DISPLAY_PCT) buyDisp = MIN_DISPLAY_PCT;
		if (sellDisp < MIN_DISPLAY_PCT) sellDisp = MIN_DISPLAY_PCT;

		const diff = 100 - (buyDisp + sellDisp);
		if (diff !== 0) {
			if (buyRaw >= sellRaw) buyDisp += diff;
			else sellDisp += diff;
		}

		buyDisp = Math.max(0, Math.min(100, buyDisp));
		sellDisp = Math.max(0, Math.min(100, sellDisp));

		return { buy: buyDisp, sell: sellDisp };
	};

	const { buy: buyDisp, sell: sellDisp } = toDisplayPair(totals.buyPct, totals.sellPct);

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

	useLayoutEffect(() => {
		if (!scrollRef.current) return;

		const parent = scrollRef.current;

		if (ordersBuySell.code === 'all' && ordersMiddleRef.current) {
			const child = ordersMiddleRef.current;

			const parentRect = parent.getBoundingClientRect();
			const childRect = child.getBoundingClientRect();

			const scrollTop =
				childRect.top -
				parentRect.top +
				parent.scrollTop -
				parent.clientHeight / 2 +
				childRect.height / 2;

			parent.scrollTop = Math.round(scrollTop);
		} else {
			parent.scrollTop = 0;
		}
	}, [ordersLoading, filteredOrdersHistory.length, ordersBuySell.code]);

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
									groupBy={(r) => r.type}
									scrollRef={scrollRef}
									renderGroupHeader={({ groupKey }) => {
										if (groupKey === 'buy') {
											return (
												<div ref={ordersMiddleRef} style={{ height: 0 }} />
											);
										}
									}}
									getRowProps={(row) => {
										const rowTotalZano = new Decimal(row.left || 0).mul(
											new Decimal(row.price || 0),
										);
										const denom =
											row.type === 'buy'
												? totals.maxBuyRow
												: totals.maxSellRow;
										const widthPct = denom.gt(0)
											? rowTotalZano.mul(100).div(denom)
											: new Decimal(0);

										return {
											className: styles[row.type],
											style: {
												'--precentage': `${widthPct.toDecimalPlaces(2).toString()}%`,
											} as React.CSSProperties,
											onClick: (event) => takeOrderClick(event, row),
											onMouseMove: (event) => {
												const tr = event.target as HTMLElement;
												if (tr.classList.contains('alias'))
													setOrdersInfoTooltip(null);
											},
											onMouseEnter: () => setOrdersInfoTooltip(row),
											onMouseLeave: () => setOrdersInfoTooltip(null),
										};
									}}
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
			<div className={styles.ordersPool}>
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

					{currentOrder.type === 'orders' && !ordersLoading && totals.totalZano.gt(0) && (
						<div className={styles.ordersPool__content_stats}>
							<div
								style={{ '--width': `${buyDisp}%` } as React.CSSProperties}
								className={classes(styles.stat_item, styles.buy)}
							>
								<div className={styles.stat_item__badge}>B</div>
								{buyDisp}%
							</div>

							<div
								style={{ '--width': `${sellDisp}%` } as React.CSSProperties}
								className={classes(styles.stat_item, styles.sell)}
							>
								{sellDisp}%<div className={styles.stat_item__badge}>S</div>
							</div>
						</div>
					)}
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
