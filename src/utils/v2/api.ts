import Period from '@/interfaces/common/Period';
import {
	V2Admin,
	V2AdminsPage,
	V2Candle,
	V2FeaturedPair,
	V2FeaturedPairsPage,
	V2IncomingProposal,
	V2Me,
	V2MatchOrder,
	V2MyPairOrder,
	V2Order,
	V2OrderStatus,
	V2OrdersPage,
	V2OutgoingProposal,
	V2Pair,
	V2PairByAssets,
	V2PairsPage,
	V2PublicOrder,
	V2ProposalsPage,
	V2Response,
	V2Side,
	V2SwapProposalBase,
	V2TradesPage,
	V2VolumeStats,
} from './types';
import { V2Transport } from './transport';
import { getCandlesQuery } from './mappers';

export const V2_MAX_PAGE_COUNT = 100;

export type V2PairsSort = 'ID' | 'VOLUME_24H_ASC' | 'VOLUME_24H_DESC';

export interface V2PairsQuery {
	cursor?: string | null;
	count: number;
	whitelistedOnly: boolean;
	searchText?: string;
	sort?: V2PairsSort;
}

export interface V2MyOrdersQuery {
	cursor?: string | null;
	count: number;
	pairId?: string;
	side?: V2Side;
	status?: V2OrderStatus;
	createdFrom?: string;
	createdTo?: string;
}

export interface V2CancelAllBody {
	pairId: string | null;
	side: V2Side | null;
	createdFrom: string | null;
	createdTo: string | null;
}

export interface V2CreateOrderBody {
	pairId: string;
	amountInAtomics: string;
	priceInAtomics: string;
	side: V2Side;
	minPerApplyAmountInAtomics: string | null;
	maxPerApplyAmountInAtomics: string | null;
}

export interface V2CreateSwapBody {
	initiatorOrderId: string;
	counterpartyOrderId: string;
	hexRawProposal: string;
	baseAmountInAtomics: string;
	quoteAmountInAtomics: string;
}

const enc = encodeURIComponent;

export const v2Api = (t: V2Transport) => ({
	requestAuth: (body: { address: string; alias: string; path: string }) =>
		t<{ message: string }>('POST', '/auth/request-auth', { body }),

	auth: (body: {
		address: string;
		alias: string;
		message: string;
		pkey: string;
		signature: string;
	}) => t<{ data: string }>('POST', '/auth', { body }),

	getPair: (pairId: string) => t<V2Pair>('GET', `/pairs/${enc(pairId)}`),

	getPairs: ({ cursor, count, whitelistedOnly, searchText, sort }: V2PairsQuery) =>
		t<V2PairsPage>('GET', '/pairs/get-all-by-cursor', {
			query: {
				cursor,
				count,
				whitelistedOnly: whitelistedOnly ? 'true' : 'false',
				searchText,
				sort,
			},
		}),

	getPairByAssets: (baseAssetId: string, quoteAssetId: string) =>
		t<V2PairByAssets>(
			'GET',
			`/pairs/get-by-assets-ids/${enc(baseAssetId)}/${enc(quoteAssetId)}`,
		),

	getPublicOrders: (pairId: string, cursor: string | null, count: number, side?: V2Side) =>
		t<V2OrdersPage<V2PublicOrder>>('GET', '/orders/get-all-by-cursor', {
			query: { pairId, cursor, count, side },
		}),

	getTrades: (pairId: string, cursor: string | null, count: number) =>
		t<V2TradesPage>('GET', '/trades/get-all-by-cursor', {
			query: { pairId, cursor, count },
		}),

	getCandles: (pairId: string, period: Period) =>
		t<{ candles: V2Candle[] }>('GET', `/stats/get-candles-data/${enc(pairId)}`, {
			query: getCandlesQuery(period),
		}),

	createOrder: (token: string | null, body: V2CreateOrderBody) =>
		t<V2Order>('POST', '/orders', { token, body }),

	cancelOrder: (token: string | null, orderId: string) =>
		t<{ id: string; status: V2OrderStatus }>('POST', `/orders/cancel/${enc(orderId)}`, {
			token,
		}),

	cancelAll: (token: string | null, body: V2CancelAllBody) =>
		t<{ cancelledOrdersCount: number }>('POST', '/orders/cancel-all', { token, body }),

	getMyOrdersByPair: (
		token: string | null,
		query: { pairId: string; cursor?: string | null; count: number; status?: V2OrderStatus },
	) =>
		t<V2OrdersPage<V2MyPairOrder>>('GET', '/orders/get-all-my-by-pair-by-cursor', {
			token,
			query,
		}),

	getMyOrders: (token: string | null, query: V2MyOrdersQuery) =>
		t<V2OrdersPage<V2Order>>('GET', '/orders/get-all-my-by-cursor', {
			token,
			query: { ...query },
		}),

	getMatches: (token: string | null, orderId: string, cursor: string | null, count: number) =>
		t<V2OrdersPage<V2MatchOrder>>('GET', `/matches/get-all-by-cursor/${enc(orderId)}`, {
			token,
			query: { cursor, count },
		}),

	getIncomingProposals: (
		token: string | null,
		orderId: string,
		cursor: string | null,
		count: number,
	) =>
		t<V2ProposalsPage<V2IncomingProposal>>(
			'GET',
			`/swap-proposals/get-all-my-incoming-pending-by-cursor/${enc(orderId)}`,
			{ token, query: { cursor, count } },
		),

	getOutgoingProposals: (
		token: string | null,
		orderId: string,
		cursor: string | null,
		count: number,
	) =>
		t<V2ProposalsPage<V2OutgoingProposal>>(
			'GET',
			`/swap-proposals/get-all-my-outgoing-pending-by-cursor/${enc(orderId)}`,
			{ token, query: { cursor, count } },
		),

	createSwapProposal: (token: string | null, body: V2CreateSwapBody) =>
		t<V2SwapProposalBase & { hexRawProposal: string }>('POST', '/swap-proposals', {
			token,
			body,
		}),

	acceptSwapProposal: (token: string | null, swapProposalId: string) =>
		t<{ id: string; status: string }>('POST', `/swap-proposals/${enc(swapProposalId)}/accept`, {
			token,
		}),

	rejectSwapProposal: (token: string | null, swapProposalId: string) =>
		t<{ id: string; status: string }>('POST', `/swap-proposals/${enc(swapProposalId)}/reject`, {
			token,
		}),

	getMe: (token: string | null) => t<V2Me>('GET', '/users/me', { token }),

	refreshOnline: (token: string | null) =>
		t<{ id: string; lastOnlineAt: string }>('POST', '/users/refresh-online', { token }),

	getAdmins: (token: string | null, count: number, offset: number) =>
		t<V2AdminsPage>('GET', '/control/admins', { token, query: { count, offset } }),

	addAdmin: (token: string | null, alias: string) =>
		t<V2Admin>('POST', '/control/add-admin', { token, body: { alias } }),

	deleteAdmin: (token: string | null, userId: string) =>
		t<V2Admin>('DELETE', '/control/delete-admin', { token, body: { userId } }),

	getFeaturedPairs: (token: string | null, count: number, offset: number) =>
		t<V2FeaturedPairsPage>('GET', '/control/featured-pairs', {
			token,
			query: { count, offset },
		}),

	addFeaturedPair: (token: string | null, baseAssetId: string, quoteAssetId: string) =>
		t<V2FeaturedPair>('POST', '/control/add-featured-pair', {
			token,
			body: { baseAssetId, quoteAssetId },
		}),

	getVolumeStats: (
		token: string | null,
		query: { address: string; pairId: string; from?: string; to?: string },
	) => t<V2VolumeStats>('GET', '/control/volume-stats', { token, query }),

	deleteFeaturedPair: (token: string | null, pairId: string) =>
		t<V2FeaturedPair>('DELETE', '/control/delete-featured-pair', { token, body: { pairId } }),
});

export type V2Api = ReturnType<typeof v2Api>;

export async function collectPages<T>(
	fetchPage: (
		cursor: string | null,
	) => Promise<V2Response<{ items: T[]; nextCursor: string | null }>>,
	maxPages: number,
): Promise<V2Response<T[]>> {
	const items: T[] = [];
	let cursor: string | null = null;

	for (let page = 0; page < maxPages; page += 1) {
		const res = await fetchPage(cursor);
		if (!res.success) return res;

		items.push(...res.result.items);
		cursor = res.result.nextCursor;
		if (!cursor) break;
	}

	return { success: true, result: items };
}

export async function getAllPublicOrders(api: V2Api, pairId: string, maxPages = 5) {
	return collectPages<V2PublicOrder>(async (cursor) => {
		const res = await api.getPublicOrders(pairId, cursor, V2_MAX_PAGE_COUNT);
		if (!res.success) return res;
		return {
			success: true,
			result: { items: res.result.orders, nextCursor: res.result.nextCursor },
		};
	}, maxPages);
}
