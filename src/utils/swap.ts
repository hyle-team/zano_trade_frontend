import Decimal from 'decimal.js';
import ApplyTip from '@/interfaces/common/ApplyTip';
import OfferType from '@/interfaces/common/OfferType';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import UserPendingType from '@/interfaces/common/UserPendingType';

export const SWAP_FEE_ZANO = '0.01';

export type SwapMode = 'standard' | 'advanced';

const safeDecimal = (value: string | number | null | undefined) => {
	try {
		return new Decimal(value ?? 0);
	} catch {
		return new Decimal(0);
	}
};

export function getCounterOrders(orderBook: PageOrderData[], type: OfferType, ownAddress?: string) {
	const counterType: OfferType = type === 'buy' ? 'sell' : 'buy';

	return orderBook
		.filter((order) => order.type === counterType && order.status !== 'finished')
		.filter((order) => !ownAddress || order.user?.address !== ownAddress)
		.sort((a, b) => {
			const diff = safeDecimal(a.price).comparedTo(safeDecimal(b.price));
			return type === 'buy' ? diff : -diff;
		});
}

export function getMarketPrice(
	orderBook: PageOrderData[],
	type: OfferType,
	fallbackRate?: number | null,
	ownAddress?: string,
) {
	const [best] = getCounterOrders(orderBook, type, ownAddress);

	if (best) return { price: safeDecimal(best.price).toFixed(), fromOrderBook: true };

	if (fallbackRate && safeDecimal(fallbackRate).gt(0)) {
		return { price: safeDecimal(fallbackRate).toFixed(), fromOrderBook: false };
	}

	return { price: '', fromOrderBook: false };
}

export function getAvailableLiquidity(
	orderBook: PageOrderData[],
	type: OfferType,
	price: string,
	ownAddress?: string,
) {
	const limit = safeDecimal(price);

	return getCounterOrders(orderBook, type, ownAddress)
		.filter((order) =>
			type === 'buy'
				? safeDecimal(order.price).lte(limit)
				: safeDecimal(order.price).gte(limit),
		)
		.reduce((acc, order) => acc.plus(safeDecimal(order.left)), new Decimal(0));
}

export function pickBestMatch(tips: ApplyTip[], ownType: OfferType): ApplyTip | undefined {
	return [...tips].sort((a, b) => {
		if (a.isInstant !== b.isInstant) return a.isInstant ? -1 : 1;

		const priceDiff = safeDecimal(a.price).comparedTo(safeDecimal(b.price));
		if (priceDiff !== 0) return ownType === 'buy' ? priceDiff : -priceDiff;

		const leftDiff = safeDecimal(b.left).comparedTo(safeDecimal(a.left));
		if (leftDiff !== 0) return leftDiff;

		return Number(a.timestamp ?? 0) - Number(b.timestamp ?? 0);
	})[0];
}

export function formatTokenAmount(value: string | number | Decimal | null | undefined, dp = 8) {
	const decimal = safeDecimal(value instanceof Decimal ? value.toString() : value);

	if (decimal.isZero()) return '0';

	const fixed = decimal.toDecimalPlaces(dp, Decimal.ROUND_DOWN);

	if (fixed.isZero()) return `<${new Decimal(1).div(new Decimal(10).pow(dp)).toFixed()}`;

	const [int, frac] = fixed.toFixed().split('.');
	const groupedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	return frac ? `${groupedInt}.${frac}` : groupedInt;
}

export function formatUsd(value: Decimal | null | undefined) {
	if (!value || value.isNaN() || value.isZero()) return undefined;
	if (value.lt(0.01)) return '<$0.01';
	return `$${value.toDecimalPlaces(2).toNumber().toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export { safeDecimal };

export type OrderSwapStage = 'waiting' | 'match' | 'requested' | 'proposal';

export function getOrderSwapState(
	order: { id: string | number; type: OfferType },
	applyTips: ApplyTip[],
	pendings: UserPendingType[],
) {
	const orderTips = applyTips.filter((t) => String(t.connected_order_id) === String(order.id));
	const proposal = orderTips.find((t) => t.transaction);
	const matches = orderTips.filter((t) => !t.transaction);
	const bestMatch = pickBestMatch(matches, order.type);

	const myRequest = pendings.find(
		(p) =>
			p.creator === order.type &&
			String(order.type === 'buy' ? p.buy_order_id : p.sell_order_id) === String(order.id),
	);

	let stage: OrderSwapStage = 'waiting';
	if (proposal) stage = 'proposal';
	else if (myRequest) stage = 'requested';
	else if (bestMatch) stage = 'match';

	return { stage, proposal, bestMatch, myRequest, matchesCount: matches.length };
}
