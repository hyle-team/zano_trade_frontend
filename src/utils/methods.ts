import CurrencyContentRow from '@/interfaces/common/CurrencyContentRow';
import CurrencyRow from '@/interfaces/common/CurrencyRow';
import Period from '@/interfaces/common/Period';
import ApplyOrderData from '@/interfaces/fetch-data/apply-order/ApplyOrderData';
import GetPageData from '@/interfaces/fetch-data/get-page/GetPageData';
import UpdateOfferData from '@/interfaces/fetch-data/update-offer/UpdateOfferData';
import ErrorRes from '@/interfaces/responses/ErrorRes';
import GetStatsRes from '@/interfaces/responses/offers/GetStatsRes';
import GetConfigRes from '@/interfaces/responses/config/GetConfigRes';
import GetPairsPageRes from '@/interfaces/responses/dex/GetPairsPageRes';
import GetPairRes from '@/interfaces/responses/dex/GetPairRes';
import GetPageRes from '@/interfaces/responses/offers/GetPageRes';
import GetOrdersPageRes from '@/interfaces/responses/orders/GetOrdersPageRes';
import GetUserRes from '@/interfaces/responses/user/GetUserRes';
import GetUserOrdersRes from '@/interfaces/responses/orders/GetUserOrdersRes';
import GetCandlesRes from '@/interfaces/responses/candles/GetCandlesRes';
import GetChartOrdersRes from '@/interfaces/responses/orders/GetChartOrdersRes';
import GetPairStatsRes from '@/interfaces/responses/orders/GetPairStatsRes';
import GetUserOrdersPageRes from '@/interfaces/responses/orders/GetUserOrdersPageRes';
import GetChatRes from '@/interfaces/responses/chats/GetChatRes';
import GetAllChatsRes from '@/interfaces/responses/chats/GetAllChatsRes';
import CreateOrderData from '@/interfaces/fetch-data/create-order/CreateOrderData';
import GetChatChunkRes from '@/interfaces/responses/chats/GetChatChunkRes';
import axios from 'axios';
import GetPairsPagesAmountRes from '@/interfaces/responses/dex/GetPairsPagesAmountRes';
import { PairSortOption } from '@/interfaces/enum/pair';

export async function getUser(): Promise<ErrorRes | GetUserRes> {
	return axios
		.post('/api/user/get-user', {
			token: sessionStorage.getItem('token'),
		})
		.then((res) => res.data);
}

export async function getConfig(): Promise<ErrorRes | GetConfigRes> {
	return axios.get('/api/config').then((res) => res.data);
}

export async function updateOffer(
	offerData: UpdateOfferData,
): Promise<ErrorRes | { success: true }> {
	return axios
		.post('/api/offers/update', {
			token: sessionStorage.getItem('token'),
			offerData,
		})
		.then((res) => res.data);
}

export async function deleteOffer(number: string): Promise<ErrorRes | { success: true }> {
	return axios
		.post('/api/offers/delete', {
			token: sessionStorage.getItem('token'),
			offerData: {
				number: number ?? null,
			},
		})
		.then((res) => res.data);
}

export async function getPage(
	params: GetPageData,
	host: string | undefined = undefined,
): Promise<ErrorRes | GetPageRes> {
	return axios
		.post(`${host ? `http://${host}` : ''}/api/offers/get-page`, {
			data: params,
		})
		.then((res) => res.data);
}

export async function getStats(host: string | undefined = undefined): Promise<GetStatsRes> {
	return (await fetch(`${host ? `https://${host}` : ''}/api/offers/get-stats`).then((res) =>
		res.json(),
	)) as GetStatsRes;
}

export async function findPairID(
	first: string,
	second: string,
	host: string | undefined = undefined,
): Promise<number | undefined> {
	const findPairURL = `${host ?? ''}/api/dex/find-pair`;

	console.log('Find pair URL:', findPairURL);

	return (await fetch(findPairURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			first,
			second,
		}),
	})
		.then((res) => res.json())
		.then((res) => parseInt(res?.data, 10) || undefined)) as number | undefined;
}

export function getFormattedCurrencies(currencies: CurrencyRow[]): CurrencyContentRow[] {
	const currenciesElements = [
		{
			name: 'Crypto currencies',
			data: currencies
				.filter((e) => e.type === 'crypto')
				.map((e) => ({
					...e,
				})),
		},
		{
			name: 'Fiat currencies',
			data: currencies
				.filter((e) => e.type === 'fiat')
				.map((e) => ({
					...e,
				})),
		},
	];

	return currenciesElements;
}

export async function sendFavouriteCurrencies(
	currs: string[],
): Promise<ErrorRes | { success: true }> {
	return axios
		.post('/api/user/set-favourite-currencies', {
			token: sessionStorage.getItem('token'),
			data: currs,
		})
		.then((res) => res.data);
}

export async function createChat(
	number: string,
	pay: string,
	receive: string,
): Promise<ErrorRes | { success: true; data: number }> {
	return axios
		.post('/api/chats/create', {
			token: sessionStorage.getItem('token'),
			number,
			chatData: {
				pay,
				receive,
			},
		})
		.then((res) => res.data);
}

export async function getChat(id: string): Promise<ErrorRes | GetChatRes> {
	return axios
		.post('/api/chats/get-chat', {
			token: sessionStorage.getItem('token'),
			id,
		})
		.then((res) => res.data);
}

export async function getAllChats(): Promise<ErrorRes | GetAllChatsRes> {
	return axios
		.post('/api/chats/get-all-chats', {
			token: sessionStorage.getItem('token'),
		})
		.then((res) => res.data);
}

export async function deleteChat(
	id: string,
): Promise<ErrorRes | { success: true; data?: undefined }> {
	return axios
		.post('/api/chats/delete-chat', {
			token: sessionStorage.getItem('token'),
			id,
		})
		.then((res) => res.data);
}

export async function getPairsPage(
	page: number,
	searchText: string,
	whitelistedOnly: boolean,
	sortOption: PairSortOption,
): Promise<ErrorRes | GetPairsPageRes> {
	return axios
		.post('/api/dex/get-pairs-page', {
			page,
			searchText,
			whitelistedOnly,
			sortOption,
		})
		.then((res) => res.data);
}

export async function getPairsPagesAmount(
	searchText: string,
	whitelistedOnly: boolean,
): Promise<ErrorRes | GetPairsPagesAmountRes> {
	return axios
		.post('/api/dex/get-pairs-pages-amount', {
			searchText,
			whitelistedOnly,
		})
		.then((res) => res.data);
}

export async function getPair(id: string): Promise<ErrorRes | GetPairRes> {
	return axios
		.post('/api/dex/get-pair', {
			id,
		})
		.then((res) => res.data);
}

export async function createOrder(
	orderData: CreateOrderData,
): Promise<ErrorRes | { success: true; data: { immediateMatch: boolean } }> {
	return axios
		.post('/api/orders/create', {
			token: sessionStorage.getItem('token'),
			orderData,
		})
		.then((res) => res.data);
}

export async function getOrdersPage(pairId: string): Promise<ErrorRes | GetOrdersPageRes> {
	return axios
		.post('/api/orders/get-page', {
			pairId,
		})
		.then((res) => res.data);
}

export async function getUserOrdersPage(pairId: string): Promise<ErrorRes | GetUserOrdersPageRes> {
	return axios
		.post('/api/orders/get-user-page', {
			token: sessionStorage.getItem('token'),
			pairId,
		})
		.then((res) => res.data);
}

export async function getUserOrders(): Promise<ErrorRes | GetUserOrdersRes> {
	return axios
		.post('/api/orders/get', {
			token: sessionStorage.getItem('token'),
		})
		.then((res) => res.data);
}

export async function cancelOrder(id: string): Promise<ErrorRes | { success: true }> {
	return axios
		.post('/api/orders/cancel', {
			token: sessionStorage.getItem('token'),
			orderId: id,
		})
		.then((res) => res.data);
}

export async function cancelTransaction(id: string): Promise<ErrorRes | { success: true }> {
	return axios
		.post('/api/transactions/cancel', {
			token: sessionStorage.getItem('token'),
			transactionId: id,
		})
		.then((res) => res.data);
}

export async function getCandles(
	pairId: string,
	period: Period,
): Promise<ErrorRes | GetCandlesRes> {
	return axios
		.post('/api/orders/get-candles', {
			pairId,
			period,
		})
		.then((res) => res.data);
}

export async function getChartOrders(pairId: string): Promise<ErrorRes | GetChartOrdersRes> {
	return axios
		.post('/api/orders/get-chart-orders', {
			pairId,
		})
		.then((res) => res.data);
}

export async function getPairStats(pairId: string): Promise<ErrorRes | GetPairStatsRes> {
	return axios
		.post('/api/orders/get-pair-stats', {
			pairId,
		})
		.then((res) => res.data);
}

export async function applyOrder(orderData: ApplyOrderData): Promise<ErrorRes | { success: true }> {
	return axios
		.post('/api/orders/apply-order', {
			token: sessionStorage.getItem('token'),
			orderData,
		})
		.then((res) => res.data);
}

export async function confirmTransaction(
	transactionId: string,
): Promise<ErrorRes | { success: true }> {
	return axios
		.post('/api/transactions/confirm', {
			transactionId,
			token: sessionStorage.getItem('token'),
		})
		.then((res) => res.data);
}

export async function getChatChunk(
	chatId: string,
	chunkNumber: number,
): Promise<ErrorRes | GetChatChunkRes> {
	return axios
		.post('/api/chats/get-chat-chunk', {
			token: sessionStorage.getItem('token'),
			id: chatId,
			chunkNumber,
		})
		.then((res) => res.data);
}

export async function getTrades(pairId: string) {
	return axios
		.post(`/api/orders/get-trades`, {
			pairId,
		})
		.then((res) => res.data);
}

export async function getUserPendings() {
	return axios
		.post('/api/transactions/get-my-pending', {
			token: sessionStorage.getItem('token'),
		})
		.then((res) => res.data);
}

export async function getZanoPrice() {
	return axios
		.get(
			'https://explorer.zano.org/api/price?asset_id=d6329b5b1f7c0805b5c345f4957554002a2f557845f64d7645dae0e051a6498a',
		)
		.then((res) => res.data);
}

export async function getMatrixAddresses(addresses: string[]) {
	try {
		const { data } = await axios.post('https://messenger.zano.org/api/get-addresses', {
			addresses,
		});

		return data;
	} catch (error) {
		console.log(error);
	}
}
