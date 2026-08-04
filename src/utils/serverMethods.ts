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

export async function getPair(
	id: string,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | GetPairRes> {
	return serverFetch(`${API_URL}/api/dex/get-pair`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id }),
		xForwardedFor,
	}).then((res) => res.json());
}

export async function getPairStats(
	pairId: string,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | GetPairStatsRes> {
	return serverFetch(`${API_URL}/api/orders/get-pair-stats`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ pairId }),
		xForwardedFor,
	}).then((res) => res.json());
}

export async function getOrdersPage(
	pairId: string,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | GetOrdersPageRes> {
	return serverFetch(`${API_URL}/api/orders/get-page`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ pairId }),
		xForwardedFor,
	}).then((res) => res.json());
}

export async function getTrades(
	pairId: string,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | { success: true; data: Trade[] }> {
	return serverFetch(`${API_URL}/api/orders/get-trades`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ pairId }),
		xForwardedFor,
	}).then((res) => res.json());
}

export async function getCandles(
	pairId: string,
	period: Period,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | GetCandlesRes> {
	return serverFetch(`${API_URL}/api/orders/get-candles`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ pairId, period }),
		xForwardedFor,
	}).then((res) => res.json());
}

export async function getPairsPage(
	page: number,
	searchText: string,
	whitelistedOnly: boolean,
	sortOption: PairSortOption,
	{ xForwardedFor }: ForwardedForParam = {},
): Promise<ErrorRes | GetPairsPageRes> {
	return serverFetch(`${API_URL}/api/dex/get-pairs-page`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ page, searchText, whitelistedOnly, sortOption }),
		xForwardedFor,
	}).then((res) => res.json());
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
): Promise<number | undefined> {
	return serverFetch(`${API_URL}/api/dex/find-pair`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ first, second }),
		xForwardedFor,
	})
		.then((res) => res.json() as Promise<{ data?: string }>)
		.then((data) => parseInt(data?.data ?? '', 10) || undefined);
}
