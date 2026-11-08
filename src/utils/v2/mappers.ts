import Decimal from 'decimal.js';
import PairData from '@/interfaces/common/PairData';
import CurrencyRow, { Asset } from '@/interfaces/common/CurrencyRow';
import OrderRow from '@/interfaces/common/OrderRow';
import ApplyTip from '@/interfaces/common/ApplyTip';
import UserPendingType from '@/interfaces/common/UserPendingType';
import CandleRow from '@/interfaces/common/CandleRow';
import Period from '@/interfaces/common/Period';
import OfferType from '@/interfaces/common/OfferType';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { OrderDataWithPair, PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import {
	V2Asset,
	V2Candle,
	V2CandleMode,
	V2IncomingProposal,
	V2MatchOrder,
	V2Order,
	V2OutgoingProposal,
	V2Pair,
	V2PairStats,
	V2PublicOrder,
	V2Side,
	V2TradePerformedEvent,
} from './types';

const toNumber = (value: string | null | undefined) => {
	if (value === null || value === undefined) return 0;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const toMs = (iso: string) => String(new Date(iso).getTime());

export const sideToType = (side: V2Side): OfferType => (side === 'BUY' ? 'buy' : 'sell');

export const typeToSide = (type: string): V2Side => (type === 'buy' ? 'BUY' : 'SELL');

export const toAtomics = (value: Decimal.Value, decimalPoint: number) =>
	new Decimal(value)
		.mul(new Decimal(10).pow(decimalPoint))
		.toDecimalPlaces(0, Decimal.ROUND_DOWN);

export function toCurrencyRow(asset: V2Asset): CurrencyRow {
	const assetInfo: Asset = {
		asset_id: asset.assetId,
		logo: '',
		price_url: '',
		ticker: asset.ticker,
		full_name: asset.fullName,
		total_max_supply: asset.totalMaxSupply as unknown as bigint,
		current_supply: asset.currentSupply as unknown as bigint,
		decimal_point: asset.decimalPoint,
		meta_info: '',
	};

	return {
		id: asset.assetId,
		name: asset.ticker,
		code: asset.ticker,
		type: 'crypto',
		asset_id: asset.assetId,
		asset_info: assetInfo,
		whitelisted: asset.isWhitelisted,
	};
}

export function toPairStats(stats: V2PairStats): PairStats {
	return {
		rate: toNumber(stats.lastPrice),
		coefficient: toNumber(stats.change24hPercent),
		high: toNumber(stats.high24h),
		low: toNumber(stats.low24h),
		volume: toNumber(stats.volume24h),
	};
}

export function toPairData(pair: V2Pair): PairData {
	const stats = toPairStats(pair.stats);

	return {
		id: pair.id,
		first_currency: toCurrencyRow(pair.baseAsset),
		second_currency: toCurrencyRow(pair.quoteAsset),
		rate: stats.rate,
		coefficient: stats.coefficient,
		high: stats.high,
		low: stats.low,
		volume: stats.volume,
		featured: false,
		whitelisted: pair.baseAsset.isWhitelisted,
	};
}

export function toOrderRow(order: V2Order): OrderRow {
	return {
		id: order.id,
		type: sideToType(order.side),
		timestamp: toMs(order.createdAt),
		side: 'limit',
		price: order.price as unknown as number,
		amount: order.amount as unknown as number,
		total: new Decimal(order.amount).mul(order.price).toFixed() as unknown as number,
		pair_id: order.pairId,
		user_id: order.userId,
		status: order.status === 'ACTIVE' ? 'active' : 'finished',
		left: order.left as unknown as number,
		min_per_apply_amount: order.minPerApplyAmount as unknown as number | null,
		max_per_apply_amount: order.maxPerApplyAmount as unknown as number | null,
		isInstant: false,
	};
}

export function toPageOrderData(order: V2PublicOrder): PageOrderData {
	return {
		...toOrderRow(order),
		user: { alias: order.user.alias, address: order.user.address },
	};
}

export function toOrderDataWithPair(order: V2Order, pair: V2Pair): OrderDataWithPair {
	return {
		...toOrderRow(order),
		pair: toPairData(pair),
	};
}

export function toUserOrderData(order: V2Order, pair: V2Pair | undefined): UserOrderData {
	const row = toOrderRow(order);
	const pairData = pair ? toPairData(pair) : null;
	const currencyStub = (assetId = ''): CurrencyRow => ({ id: assetId, name: '', code: '' });

	const firstCurrency = pairData?.first_currency ?? currencyStub();
	const secondCurrency = pairData?.second_currency ?? currencyStub();

	return {
		...row,
		min_per_apply_amount: order.minPerApplyAmount,
		max_per_apply_amount: order.maxPerApplyAmount,
		first_currency: firstCurrency,
		second_currency: secondCurrency,
		pair: {
			id: order.pairId as unknown as number,
			first_currency_id: firstCurrency.id as unknown as number,
			second_currency_id: secondCurrency.id as unknown as number,
			rate: pairData?.rate,
			coefficient: pairData?.coefficient,
			high: pairData?.high,
			low: pairData?.low,
			volume: pairData?.volume ?? 0,
			featured: false,
			first_currency: firstCurrency as unknown as UserOrderData['pair']['first_currency'],
			second_currency: secondCurrency as unknown as UserOrderData['pair']['second_currency'],
		},
	};
}

export function matchToApplyTip(match: V2MatchOrder, myOrderId: string): ApplyTip {
	return {
		id: match.id,
		left: match.left as unknown as number,
		price: match.price as unknown as number,
		user: { alias: match.user.alias, address: match.user.address },
		timestamp: toMs(match.createdAt),
		type: sideToType(match.side),
		total: new Decimal(match.left).mul(match.price).toFixed() as unknown as number,
		connected_order_id: myOrderId,
		transaction: false,
		isInstant: false,
		to_be_traded: match.toBeTraded,
	};
}

export function incomingProposalToApplyTip(
	proposal: V2IncomingProposal,
	myOrderType: OfferType,
): ApplyTip {
	return {
		id: proposal.id,
		left: proposal.baseAmount as unknown as number,
		price: proposal.price as unknown as number,
		user: {
			alias: proposal.initiatorOrderUser.alias,
			address: proposal.initiatorOrderUser.address,
		},
		timestamp: toMs(proposal.createdAt),
		type: myOrderType === 'buy' ? 'sell' : 'buy',
		total: proposal.quoteAmount as unknown as number,
		connected_order_id: proposal.counterpartyOrderId,
		transaction: true,
		hex_raw_proposal: proposal.hexRawProposal,
		isInstant: false,
	};
}

export function outgoingProposalToPending(
	proposal: V2OutgoingProposal,
	myOrderType: OfferType,
): UserPendingType {
	const isBuy = myOrderType === 'buy';

	return {
		id: proposal.id,
		amount: proposal.baseAmount,
		price: proposal.price,
		finalizer: {
			id: proposal.counterpartyOrderUser.id,
			address: proposal.counterpartyOrderUser.address,
			alias: proposal.counterpartyOrderUser.alias,
			order_id: proposal.counterpartyOrderId,
		},
		buy_order_id: isBuy ? proposal.initiatorOrderId : proposal.counterpartyOrderId,
		sell_order_id: isBuy ? proposal.counterpartyOrderId : proposal.initiatorOrderId,
		creator: myOrderType,
		hex_raw_proposal: '',
		status: 'pending',
		timestamp: toMs(proposal.createdAt),
	};
}

const flatCandle = (timestamp: number, price: number): CandleRow => ({
	timestamp: String(timestamp),
	shadow_top: price,
	shadow_bottom: price,
	body_first: price,
	body_second: price,
});

export function toCandleRows(candles: V2Candle[], now = Date.now()): CandleRow[] {
	const rows: CandleRow[] = [];
	let prevClose: number | undefined;
	let nextStart: number | undefined;
	let width = 0;

	candles.forEach((candle) => {
		const start = new Date(candle.startedAt).getTime();
		width = new Date(candle.endedAt).getTime() - start;

		if (nextStart !== undefined && prevClose !== undefined && width > 0) {
			for (let ts = nextStart; ts < start; ts += width) rows.push(flatCandle(ts, prevClose));
		}

		const open = prevClose ?? toNumber(candle.start);
		const close = toNumber(candle.end);

		rows.push({
			timestamp: toMs(candle.startedAt),
			shadow_top: Math.max(toNumber(candle.high), open),
			shadow_bottom: Math.min(toNumber(candle.low), open),
			body_first: open,
			body_second: close,
		});

		prevClose = close;
		nextStart = start + width;
	});

	if (nextStart !== undefined && prevClose !== undefined && width > 0) {
		for (let ts = nextStart; ts <= now; ts += width) rows.push(flatCandle(ts, prevClose));
	}

	return rows;
}

export function toTrade(trade: V2TradePerformedEvent, previousPrice?: string): Trade {
	const isDown = previousPrice !== undefined && new Decimal(trade.price).lt(previousPrice);

	return {
		id: trade.id as unknown as number,
		timestamp: new Date(trade.acceptedAt).getTime(),
		amount: trade.baseAmount,
		price: trade.price,
		type: isDown ? 'sell' : 'buy',
		buyer: { address: '', amount: trade.baseAmount },
		seller: { address: '', amount: trade.quoteAmount },
	};
}

const PERIOD_TO_MODE: Record<Period, V2CandleMode> = {
	'1sec': '1m',
	'1min': '1m',
	'5min': '5m',
	'15min': '15m',
	'30min': '30m',
	'1h': '1h',
	'4h': '4h',
	'1d': '1d',
	'1w': '1w',
	'1m': '1M',
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const MODE_WIDTH_MS: Record<V2CandleMode, number> = {
	'1m': MINUTE_MS,
	'5m': 5 * MINUTE_MS,
	'15m': 15 * MINUTE_MS,
	'30m': 30 * MINUTE_MS,
	'1h': HOUR_MS,
	'4h': 4 * HOUR_MS,
	'1d': DAY_MS,
	'1w': 7 * DAY_MS,
	'1M': 28 * DAY_MS,
};

const CANDLES_WINDOW_COUNT = 900;

export function getCandlesQuery(period: Period, now = Date.now()) {
	const mode = PERIOD_TO_MODE[period] ?? '1h';
	const from = new Date(now - MODE_WIDTH_MS[mode] * CANDLES_WINDOW_COUNT);

	return {
		mode,
		from: from.toISOString(),
		to: new Date(now).toISOString(),
	};
}
