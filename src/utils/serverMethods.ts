import { API_URL } from '@/constants';
import ErrorRes from '@/interfaces/responses/ErrorRes';
import GetStatsRes from '@/interfaces/responses/offers/GetStatsRes';
import GetPairRes from '@/interfaces/responses/dex/GetPairRes';
import GetPairsPageRes from '@/interfaces/responses/dex/GetPairsPageRes';
import GetOrdersPageRes from '@/interfaces/responses/orders/GetOrdersPageRes';
import GetPairStatsRes from '@/interfaces/responses/orders/GetPairStatsRes';
import GetCandlesRes from '@/interfaces/responses/candles/GetCandlesRes';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import Period from '@/interfaces/common/Period';
import { PairSortOption } from '@/interfaces/enum/pair';
import { serverFetch } from '@/utils/serverFetch';
import { ZANO_ASSET_ID } from '@/utils/utils';
import { V2Error } from '@/utils/v2/types';
import {
	V2RequestOptions,
	V2Transport,
	buildV2Headers,
	buildV2Path,
	toV2Response,
} from '@/utils/v2/transport';
import { V2_MAX_PAGE_COUNT, getAllPublicOrders, v2Api } from '@/utils/v2/api';
import {
	toCandleRows,
	toPageOrderData,
	toPairData,
	toPairStats,
	toTrades,
} from '@/utils/v2/mappers';

/**
 * Server-side counterparts of the `@/utils/methods` wrappers, used from
 * `getServerSideProps`. These call the backend directly (bypassing the API proxy
 * middleware), so each request is signed via {@link serverFetch}. Every wrapper
 * takes the incoming request's `xForwardedFor` chain so the signature can be
 * computed for the real client IP.
 */

interface ForwardedForParam {
	xForwardedFor?: string;
}

const serverTransport =
	(xForwardedFor?: string): V2Transport =>
	async <T>(method: string, path: string, options?: V2RequestOptions) => {
		const res = await serverFetch(`${API_URL}${buildV2Path(path, options?.query)}`, {
			method,
			headers: buildV2Headers(options),
			body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
			xForwardedFor,
		});

		const data = await res.json().catch(() => null);

		return toV2Response<T>(data, res.status);
	};

const serverApi = (xForwardedFor?: string) => v2Api(serverTransport(xForwardedFor));

const fail = (error: V2Error): ErrorRes => ({ success: false, data: error.code });

export async function getPair(
	id: string,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | GetPairRes> {
	const res = await serverApi(xForwardedFor).getPair(id);
	if (!res.success) return fail(res.error);
	return { success: true, data: toPairData(res.result) };
}

export async function getPairStats(
	pairId: string,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | GetPairStatsRes> {
	const res = await serverApi(xForwardedFor).getPair(pairId);
	if (!res.success) return fail(res.error);
	return { success: true, data: toPairStats(res.result.stats) };
}

export async function getOrdersPage(
	pairId: string,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | GetOrdersPageRes> {
	const res = await getAllPublicOrders(serverApi(xForwardedFor), pairId);
	if (!res.success) return fail(res.error);
	return { success: true, data: res.result.map(toPageOrderData) };
}

export async function getTrades(
	pairId: string,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | { success: true; data: Trade[] }> {
	const res = await serverApi(xForwardedFor).getTrades(pairId, null, V2_MAX_PAGE_COUNT);
	if (!res.success) return fail(res.error);
	return { success: true, data: toTrades(res.result.trades) };
}

export async function getCandles(
	pairId: string,
	period: Period,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | GetCandlesRes> {
	const res = await serverApi(xForwardedFor).getCandles(pairId, period);
	if (!res.success) return fail(res.error);
	return { success: true, data: toCandleRows(res.result.candles) };
}

const PAIRS_PAGE_SIZE = 50;
const FEATURED_PAIRS_SCAN_COUNT = 100;

export async function getPairsPage(
	_page: number,
	searchText: string,
	whitelistedOnly: boolean,
	sortOption: PairSortOption,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | GetPairsPageRes> {
	const res = await serverApi(xForwardedFor).getPairs({
		count: PAIRS_PAGE_SIZE,
		whitelistedOnly,
		searchText: searchText || undefined,
		sort:
			sortOption === PairSortOption.VOLUME_LOW_TO_HIGH ? 'VOLUME_24H_ASC' : 'VOLUME_24H_DESC',
	});

	if (!res.success) return fail(res.error);
	return { success: true, data: res.result.pairs.map(toPairData) };
}

export async function getFeaturedPairs(
	limit: number,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | GetPairsPageRes> {
	const res = await serverApi(xForwardedFor).getPairs({
		count: FEATURED_PAIRS_SCAN_COUNT,
		whitelistedOnly: true,
		sort: 'VOLUME_24H_DESC',
	});

	if (!res.success) return fail(res.error);

	const featured = res.result.pairs.filter((p) => p.isFeatured);
	const zanoQuoted = res.result.pairs.filter((p) => p.quoteAsset.assetId === ZANO_ASSET_ID);
	const pairs = featured.length > 0 ? featured : zanoQuoted;

	return { success: true, data: pairs.slice(0, limit).map(toPairData) };
}

export async function getStats({ xForwardedFor }: ForwardedForParam = {}): Promise<GetStatsRes> {
	return serverFetch(`${API_URL}/api/offers/get-stats`, { xForwardedFor }).then((res) =>
		res.json(),
	);
}

export async function findPairID(
	first: string,
	second: string,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<string | undefined> {
	const res = await serverApi(xForwardedFor).getPairByAssets(first, second);
	return res.success ? res.result.id : undefined;
}
