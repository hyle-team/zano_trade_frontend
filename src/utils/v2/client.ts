import Decimal from 'decimal.js';
import ErrorRes from '@/interfaces/responses/ErrorRes';
import PairData from '@/interfaces/common/PairData';
import OrderRow from '@/interfaces/common/OrderRow';
import ApplyTip from '@/interfaces/common/ApplyTip';
import UserPendingType from '@/interfaces/common/UserPendingType';
import CandleRow from '@/interfaces/common/CandleRow';
import Period from '@/interfaces/common/Period';
import CreateOrderData from '@/interfaces/fetch-data/create-order/CreateOrderData';
import { PairSortOption } from '@/interfaces/enum/pair';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';
import {
	GetUserOrdersBodyStatus,
	GetUserOrdersData,
} from '@/interfaces/fetch-data/get-user-orders/GetUserOrdersData';
import { CancelAllData } from '@/interfaces/fetch-data/cancel-all-orders/CancelAllData';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import { ZANO_ASSET_ID } from '@/utils/utils';
import {
	V2Admin,
	V2Error,
	V2FeaturedPair,
	V2MyPairOrder,
	V2Order,
	V2OrderStatus,
	V2Pair,
	V2Response,
	V2VolumeStats,
} from './types';
import { clientTransport } from './transport';
import { V2_MAX_PAGE_COUNT, V2PairsSort, getAllPublicOrders, v2Api } from './api';
import {
	incomingProposalToApplyTip,
	matchToApplyTip,
	outgoingProposalToPending,
	sideToType,
	toAtomics,
	toCandleRows,
	toPageOrderData,
	toPairData,
	toPairStats,
	toMyPairOrderRow,
	toOrderRow,
	toTrades,
	toUserOrderData,
	typeToSide,
} from './mappers';

export const api = v2Api(clientTransport);

const PAIRS_PAGE_SIZE = 50;
const PAIR_CACHE_TTL_MS = 60e3;

export const toErrorRes = (error: V2Error): ErrorRes => ({ success: false, data: error.code });

const fail = (res: { success: false; error: V2Error }) => toErrorRes(res.error);

const pairCache = new Map<string, { pair: V2Pair; at: number }>();

export function rememberPair(pair: V2Pair) {
	pairCache.set(pair.id, { pair, at: Date.now() });
}

export async function getV2Pair(pairId: string, fresh = false): Promise<V2Response<V2Pair>> {
	const cached = pairCache.get(pairId);

	if (!fresh && cached && Date.now() - cached.at < PAIR_CACHE_TTL_MS) {
		return { success: true, result: cached.pair };
	}

	const res = await api.getPair(pairId);
	if (res.success) rememberPair(res.result);
	return res;
}

async function getPairsMap(pairIds: string[]) {
	const unique = Array.from(new Set(pairIds));
	const entries = await Promise.all(
		unique.map(async (id) => {
			const res = await getV2Pair(id).catch(() => null);
			return [id, res?.success ? res.result : undefined] as const;
		}),
	);

	return new Map(entries);
}

const SORT_OPTION_TO_V2: Record<PairSortOption, V2PairsSort> = {
	[PairSortOption.VOLUME_HIGH_TO_LOW]: 'VOLUME_24H_DESC',
	[PairSortOption.VOLUME_LOW_TO_HIGH]: 'VOLUME_24H_ASC',
};

const pairsCursors = new Map<string, Map<number, string | null>>();

async function resolvePairsCursor(
	key: string,
	page: number,
	fetchPage: (cursor: string | null) => ReturnType<typeof api.getPairs>,
) {
	let cursors = pairsCursors.get(key);

	if (!cursors) {
		cursors = new Map([[1, null]]);
		pairsCursors.set(key, cursors);
	}

	for (let p = 1; p < page; p += 1) {
		if (cursors.has(p + 1)) continue;

		const res = await fetchPage(cursors.get(p) ?? null);
		if (!res.success) return res;

		res.result.pairs.forEach(rememberPair);
		cursors.set(p + 1, res.result.nextCursor);
		if (!res.result.nextCursor) return { success: true as const, result: undefined };
	}

	return { success: true as const, result: cursors.get(page) };
}

export async function getPairsPage(
	page: number,
	searchText: string,
	whitelistedOnly: boolean,
	sortOption: PairSortOption,
): Promise<ErrorRes | { success: true; data: PairData[]; hasMore: boolean }> {
	const sort = SORT_OPTION_TO_V2[sortOption] ?? 'VOLUME_24H_DESC';
	const key = `${searchText}|${whitelistedOnly}|${sort}`;

	const fetchPage = (cursor: string | null) =>
		api.getPairs({
			cursor,
			count: PAIRS_PAGE_SIZE,
			whitelistedOnly,
			searchText: searchText || undefined,
			sort,
		});

	const cursorRes = await resolvePairsCursor(key, page, fetchPage);
	if (!cursorRes.success) return fail(cursorRes);
	if (page > 1 && !cursorRes.result) return { success: true, data: [], hasMore: false };

	const res = await fetchPage(cursorRes.result ?? null);
	if (!res.success) return fail(res);

	res.result.pairs.forEach(rememberPair);
	pairsCursors.get(key)?.set(page + 1, res.result.nextCursor);

	return {
		success: true,
		data: res.result.pairs.map(toPairData),
		hasMore: !!res.result.nextCursor,
	};
}

export async function getPairsPagesAmount(
	searchText: string,
	whitelistedOnly: boolean,
): Promise<ErrorRes | { success: true; data: number }> {
	const res = await getPairsPage(
		1,
		searchText,
		whitelistedOnly,
		PairSortOption.VOLUME_HIGH_TO_LOW,
	);
	if (!res.success) return res;
	return { success: true, data: res.hasMore ? 2 : 1 };
}

export async function getQuotePairsPage(
	quoteAssetId: string,
	cursor: string | null,
	searchText: string,
	whitelistedOnly: boolean,
): Promise<ErrorRes | { success: true; data: PairData[]; nextCursor: string | null }> {
	const res = await api.getPairs({
		cursor,
		count: V2_MAX_PAGE_COUNT,
		whitelistedOnly,
		searchText: searchText || quoteAssetId,
		sort: 'VOLUME_24H_DESC',
	});
	if (!res.success) return fail(res);

	res.result.pairs.forEach(rememberPair);

	return {
		success: true,
		data: res.result.pairs
			.filter((pair) => pair.quoteAsset.assetId === quoteAssetId)
			.map(toPairData),
		nextCursor: res.result.pairs.length < V2_MAX_PAGE_COUNT ? null : res.result.nextCursor,
	};
}

export async function getPair(id: string): Promise<ErrorRes | { success: true; data: PairData }> {
	const res = await getV2Pair(id, true);
	if (!res.success) return fail(res);
	return { success: true, data: toPairData(res.result) };
}

export async function getPairStats(
	pairId: string,
): Promise<ErrorRes | { success: true; data: PairStats }> {
	const res = await getV2Pair(pairId, true);
	if (!res.success) return fail(res);
	return { success: true, data: toPairStats(res.result.stats) };
}

export async function getOrdersPage(
	pairId: string,
): Promise<ErrorRes | { success: true; data: PageOrderData[] }> {
	const res = await getAllPublicOrders(api, pairId);
	if (!res.success) return fail(res);
	return { success: true, data: res.result.map(toPageOrderData) };
}

export async function getCandles(
	pairId: string,
	period: Period,
): Promise<ErrorRes | { success: true; data: CandleRow[] }> {
	const res = await api.getCandles(pairId, period);
	if (!res.success) return fail(res);
	return { success: true, data: toCandleRows(res.result.candles) };
}

export async function getTrades(
	pairId: string,
): Promise<ErrorRes | { success: true; data: Trade[] }> {
	const res = await api.getTrades(pairId, null, V2_MAX_PAGE_COUNT);
	if (!res.success) return fail(res);
	return { success: true, data: toTrades(res.result.trades) };
}

const CREATE_ORDER_ERRORS: Record<string, string> = {
	TOO_MANY_ORDERS_PER_PAIR_PER_SIDE: 'Too many orders',
	PAIR_NOT_FOUND: 'Pair not found',
	USER_OFFLINE: 'Your session is inactive. Please reconnect your wallet and try again.',
};

export async function refreshOnline(token: string | null): Promise<boolean> {
	if (!token) return false;

	const res = await api.refreshOnline(token);
	return res.success;
}

export async function createOrder(
	orderData: CreateOrderData,
	token: string | null,
): Promise<ErrorRes | { success: true; data: OrderRow & { immediateMatch?: boolean } }> {
	const pairRes = await getV2Pair(orderData.pairId);
	if (!pairRes.success) return fail(pairRes);

	const { baseAsset, quoteAsset } = pairRes.result;

	const minPerApply =
		orderData.minPerApplyAmount && new Decimal(orderData.minPerApplyAmount).gt(0)
			? toAtomics(orderData.minPerApplyAmount, baseAsset.decimalPoint).toFixed()
			: null;

	const body = {
		pairId: orderData.pairId,
		side: typeToSide(orderData.type),
		amountInAtomics: toAtomics(orderData.amount, baseAsset.decimalPoint).toFixed(),
		priceInAtomics: toAtomics(orderData.price, quoteAsset.decimalPoint).toFixed(),
		minPerApplyAmountInAtomics: minPerApply,
		maxPerApplyAmountInAtomics: null,
	};

	let res = await api.createOrder(token, body);

	if (!res.success && res.error.code === 'USER_OFFLINE' && (await refreshOnline(token))) {
		res = await api.createOrder(token, body);
	}

	if (!res.success) {
		return {
			success: false,
			data: CREATE_ORDER_ERRORS[res.error.code] ?? res.error.code,
		};
	}

	const matchesRes = await api.getMatches(token, res.result.id, null, 1).catch(() => null);
	const immediateMatch = !!(matchesRes?.success && matchesRes.result.orders.length > 0);

	return { success: true, data: { ...toOrderRow(res.result), immediateMatch } };
}

export async function cancelOrder(
	orderId: string,
	token: string | null,
): Promise<ErrorRes | { success: true }> {
	const res = await api.cancelOrder(token, orderId);
	if (!res.success) return fail(res);
	return { success: true };
}

export async function cancelAllOrders(
	{ filterInfo: { pairId, type, date } }: CancelAllData,
	token: string | null,
): Promise<ErrorRes | { success: true }> {
	const res = await api.cancelAll(token, {
		pairId: pairId ?? null,
		side: type ? typeToSide(type) : null,
		createdFrom: date ? new Date(date.from).toISOString() : null,
		createdTo: date ? new Date(date.to).toISOString() : null,
	});

	if (!res.success) return fail(res);
	return { success: true };
}

async function getMyPairOrdersRaw(token: string | null, pairId: string, status: V2OrderStatus) {
	return api.getMyOrdersByPair(token, { pairId, count: V2_MAX_PAGE_COUNT, status });
}

async function collectApplyTips(token: string | null, orders: V2MyPairOrder[]) {
	const perOrder = await Promise.all(
		orders.map(async (order) => {
			const myType = sideToType(order.side);
			const [matchesRes, incomingRes] = await Promise.all([
				order.matchesCount > 0
					? api.getMatches(token, order.id, null, V2_MAX_PAGE_COUNT).catch(() => null)
					: Promise.resolve(null),
				order.incomingPendingProposalsCount > 0
					? api
							.getIncomingProposals(token, order.id, null, V2_MAX_PAGE_COUNT)
							.catch(() => null)
					: Promise.resolve(null),
			]);

			const tips: ApplyTip[] = [];

			if (matchesRes?.success) {
				tips.push(...matchesRes.result.orders.map((m) => matchToApplyTip(m, order.id)));
			}

			if (incomingRes?.success) {
				tips.push(
					...incomingRes.result.swapProposals.map((p) =>
						incomingProposalToApplyTip(p, myType),
					),
				);
			}

			return tips;
		}),
	);

	return perOrder.flat();
}

async function collectPendings(token: string | null, orders: V2MyPairOrder[]) {
	const perOrder = await Promise.all(
		orders
			.filter((order) => order.outgoingPendingProposalsCount > 0)
			.map(async (order) => {
				const res = await api
					.getOutgoingProposals(token, order.id, null, V2_MAX_PAGE_COUNT)
					.catch(() => null);

				if (!res?.success) return [];

				return res.result.swapProposals.map((p) =>
					outgoingProposalToPending(p, sideToType(order.side)),
				);
			}),
	);

	return perOrder.flat();
}

export async function getMyPairOrders(
	pairId: string,
	status: V2OrderStatus,
	token: string | null,
): Promise<ErrorRes | { success: true; data: OrderRow[] }> {
	const res = await getMyPairOrdersRaw(token, pairId, status);
	if (!res.success) return fail(res);
	return { success: true, data: res.result.orders.map(toMyPairOrderRow) };
}

export async function getMyPairSwapState(
	pairId: string,
	token: string | null,
): Promise<
	| ErrorRes
	| {
			success: true;
			data: {
				orders: OrderRow[];
				applyTips: ApplyTip[];
				pendings: UserPendingType[];
				assetIds: { baseAssetId: string; quoteAssetId: string } | null;
			};
	  }
> {
	const [res, pairRes] = await Promise.all([
		getMyPairOrdersRaw(token, pairId, 'ACTIVE'),
		getV2Pair(pairId).catch(() => null),
	]);

	if (!res.success) return fail(res);

	const { orders } = res.result;
	const [applyTips, pendings] = await Promise.all([
		collectApplyTips(token, orders),
		collectPendings(token, orders),
	]);

	return {
		success: true,
		data: {
			orders: orders.map(toMyPairOrderRow),
			applyTips,
			pendings,
			assetIds: pairRes?.success
				? {
						baseAssetId: pairRes.result.baseAsset.assetId,
						quoteAssetId: pairRes.result.quoteAsset.assetId,
					}
				: null,
		},
	};
}

const ORDER_ITEMS_PAGE_SIZE = 20;

export type CursorPage<T> = { items: T[]; nextCursor: string | null };

const toCursorPage = <T>(items: T[], nextCursor: string | null, count: number): CursorPage<T> => ({
	items,
	nextCursor: items.length < count ? null : nextCursor,
});

export async function getOrderMatchesPage(
	order: OrderRow,
	cursor: string | null,
	token: string | null,
): Promise<ErrorRes | { success: true; data: CursorPage<ApplyTip> }> {
	const res = await api.getMatches(token, order.id, cursor, ORDER_ITEMS_PAGE_SIZE);
	if (!res.success) return fail(res);

	return {
		success: true,
		data: toCursorPage(
			res.result.orders.map((m) => matchToApplyTip(m, order.id)),
			res.result.nextCursor,
			ORDER_ITEMS_PAGE_SIZE,
		),
	};
}

export async function getOrderIncomingProposalsPage(
	order: OrderRow,
	cursor: string | null,
	token: string | null,
): Promise<ErrorRes | { success: true; data: CursorPage<ApplyTip> }> {
	const res = await api.getIncomingProposals(token, order.id, cursor, ORDER_ITEMS_PAGE_SIZE);
	if (!res.success) return fail(res);

	return {
		success: true,
		data: toCursorPage(
			res.result.swapProposals.map((p) => incomingProposalToApplyTip(p, order.type)),
			res.result.nextCursor,
			ORDER_ITEMS_PAGE_SIZE,
		),
	};
}

export async function getOrderOutgoingProposalsPage(
	order: OrderRow,
	cursor: string | null,
	token: string | null,
): Promise<ErrorRes | { success: true; data: CursorPage<UserPendingType> }> {
	const res = await api.getOutgoingProposals(token, order.id, cursor, ORDER_ITEMS_PAGE_SIZE);
	if (!res.success) return fail(res);

	return {
		success: true,
		data: toCursorPage(
			res.result.swapProposals.map((p) => outgoingProposalToPending(p, order.type)),
			res.result.nextCursor,
			ORDER_ITEMS_PAGE_SIZE,
		),
	};
}

const STATUS_TO_V2: Record<GetUserOrdersBodyStatus, V2OrderStatus> = {
	[GetUserOrdersBodyStatus.ACTIVE]: 'ACTIVE',
	[GetUserOrdersBodyStatus.FINISHED]: 'FINISHED',
};

export async function getMyOrdersPage(
	{ pairId, status, type, date }: GetUserOrdersData['filterInfo'],
	cursor: string | null,
	count: number,
	token: string | null,
): Promise<ErrorRes | { success: true; data: CursorPage<UserOrderData> }> {
	const pageCount = Math.min(Math.max(count, 1), V2_MAX_PAGE_COUNT);
	const res = await api.getMyOrders(token, {
		cursor,
		count: pageCount,
		pairId,
		side: type ? typeToSide(type) : undefined,
		status: status ? STATUS_TO_V2[status] : undefined,
		createdFrom: date ? new Date(date.from).toISOString() : undefined,
		createdTo: date ? new Date(date.to).toISOString() : undefined,
	});

	if (!res.success) return fail(res);

	const { orders, nextCursor } = res.result;
	const pairs = await getPairsMap(orders.map((o) => o.pairId));

	return {
		success: true,
		data: toCursorPage(
			orders.map((o: V2Order) => toUserOrderData(o, pairs.get(o.pairId))),
			nextCursor,
			pageCount,
		),
	};
}

const SWAP_ERRORS: Record<string, string> = {
	ORDER_FINISHED: 'Order is already finished',
	ORDERS_NOT_MATCHING: 'Orders no longer match',
	AMOUNTS_MISMATCH: 'Swap amounts do not match the order',
	INITIATOR_ORDER_NOT_FOUND: 'Your order was not found',
	COUNTERPARTY_ORDER_NOT_FOUND: 'Counter order was not found',
};

export async function createSwapProposal(
	{
		myOrderId,
		counterOrderId,
		hexRawProposal,
		baseAmountInAtomics,
		quoteAmountInAtomics,
	}: {
		myOrderId: string;
		counterOrderId: string;
		hexRawProposal: string;
		baseAmountInAtomics: string;
		quoteAmountInAtomics: string;
	},
	token: string | null,
): Promise<ErrorRes | { success: true }> {
	const res = await api.createSwapProposal(token, {
		initiatorOrderId: myOrderId,
		counterpartyOrderId: counterOrderId,
		hexRawProposal,
		baseAmountInAtomics,
		quoteAmountInAtomics,
	});

	if (!res.success) {
		return { success: false, data: SWAP_ERRORS[res.error.code] ?? res.error.code };
	}

	return { success: true };
}

export async function acceptSwapProposal(
	swapProposalId: string,
	token: string | null,
): Promise<ErrorRes | { success: true }> {
	const res = await api.acceptSwapProposal(token, swapProposalId);
	if (!res.success) return fail(res);
	return { success: true };
}

export async function rejectSwapProposal(
	swapProposalId: string,
	token: string | null,
): Promise<ErrorRes | { success: true }> {
	const res = await api.rejectSwapProposal(token, swapProposalId);
	if (!res.success) return fail(res);
	return { success: true };
}

export async function checkAdmin(token: string | null): Promise<boolean> {
	if (!token) return false;

	const res = await api.getMe(token);
	return res.success && res.result.role !== 'USER';
}

const CONTROL_PAGE_SIZE = 50;

const CONTROL_ERRORS: Record<string, string> = {
	USER_NOT_FOUND: 'User not found',
	ALREADY_ADMIN: 'Admin already exists',
	NOT_ADMIN: 'User is not an admin',
	OWNER_CANNOT_BE_DELETED: 'Owner cannot be removed',
	CANNOT_DELETE_SELF: 'You cannot remove yourself',
	PAIR_NOT_FOUND: 'Pair not found',
	ALREADY_FEATURED: 'Pair is already featured',
	NOT_FEATURED: 'Pair is not featured',
	VALIDATION_ERROR: 'Invalid value',
	FORBIDDEN: 'Access denied',
	UNAUTHORIZED: 'Unauthorized: Please log in.',
};

const controlFail = (res: { success: false; error: V2Error }): ErrorRes => ({
	success: false,
	data: CONTROL_ERRORS[res.error.code] ?? res.error.code,
});

async function collectByOffset<T>(
	fetchPage: (offset: number) => Promise<V2Response<{ items: T[]; totalCount: number }>>,
): Promise<ErrorRes | { success: true; data: T[] }> {
	const items: T[] = [];

	for (;;) {
		const res = await fetchPage(items.length);
		if (!res.success) return controlFail(res);

		items.push(...res.result.items);

		if (res.result.items.length === 0 || items.length >= res.result.totalCount) {
			return { success: true, data: items };
		}
	}
}

export async function getAdmins(
	token: string | null,
): Promise<ErrorRes | { success: true; data: V2Admin[] }> {
	return collectByOffset(async (offset) => {
		const res = await api.getAdmins(token, CONTROL_PAGE_SIZE, offset);
		if (!res.success) return res;
		return {
			success: true,
			result: { items: res.result.admins, totalCount: res.result.totalCount },
		};
	});
}

export async function addAdmin(
	alias: string,
	token: string | null,
): Promise<ErrorRes | { success: true; data: V2Admin }> {
	const res = await api.addAdmin(token, alias);
	if (!res.success) return controlFail(res);
	return { success: true, data: res.result };
}

export async function deleteAdmin(
	userId: string,
	token: string | null,
): Promise<ErrorRes | { success: true }> {
	const res = await api.deleteAdmin(token, userId);
	if (!res.success) return controlFail(res);
	return { success: true };
}

export async function getFeaturedPairs(
	token: string | null,
): Promise<ErrorRes | { success: true; data: V2FeaturedPair[] }> {
	return collectByOffset(async (offset) => {
		const res = await api.getFeaturedPairs(token, CONTROL_PAGE_SIZE, offset);
		if (!res.success) return res;
		return {
			success: true,
			result: { items: res.result.pairs, totalCount: res.result.totalCount },
		};
	});
}

export async function addFeaturedPair(
	baseAssetId: string,
	token: string | null,
): Promise<ErrorRes | { success: true; data: V2FeaturedPair }> {
	const res = await api.addFeaturedPair(token, baseAssetId, ZANO_ASSET_ID);
	if (!res.success) return controlFail(res);
	return { success: true, data: res.result };
}

export async function deleteFeaturedPair(
	pairId: string,
	token: string | null,
): Promise<ErrorRes | { success: true }> {
	const res = await api.deleteFeaturedPair(token, pairId);
	if (!res.success) return controlFail(res);
	return { success: true };
}

export async function getVolumeStats(
	query: { address: string; pairId: string; from?: string; to?: string },
	token: string | null,
): Promise<ErrorRes | { success: true; data: V2VolumeStats }> {
	const res = await api.getVolumeStats(token, query);
	if (!res.success) return controlFail(res);
	return { success: true, data: res.result };
}
