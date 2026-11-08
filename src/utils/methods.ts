import CurrencyContentRow from '@/interfaces/common/CurrencyContentRow';
import CurrencyRow from '@/interfaces/common/CurrencyRow';
import Period from '@/interfaces/common/Period';
import ApplyOrderData from '@/interfaces/fetch-data/apply-order/ApplyOrderData';
import GetPageData from '@/interfaces/fetch-data/get-page/GetPageData';
import UpdateOfferData from '@/interfaces/fetch-data/update-offer/UpdateOfferData';
import ErrorRes from '@/interfaces/responses/ErrorRes';
import GetConfigRes from '@/interfaces/responses/config/GetConfigRes';
import GetPairsPageRes from '@/interfaces/responses/dex/GetPairsPageRes';
import GetPairRes from '@/interfaces/responses/dex/GetPairRes';
import GetPageRes from '@/interfaces/responses/offers/GetPageRes';
import GetOrdersPageRes from '@/interfaces/responses/orders/GetOrdersPageRes';
import GetUserRes from '@/interfaces/responses/user/GetUserRes';
import GetUserOrdersRes from '@/interfaces/responses/orders/GetUserOrdersRes';
import GetCandlesRes from '@/interfaces/responses/candles/GetCandlesRes';
import GetPairStatsRes from '@/interfaces/responses/orders/GetPairStatsRes';
import GetUserOrdersPageRes from '@/interfaces/responses/orders/GetUserOrdersPageRes';
import GetChatRes from '@/interfaces/responses/chats/GetChatRes';
import GetAllChatsRes from '@/interfaces/responses/chats/GetAllChatsRes';
import CreateOrderData from '@/interfaces/fetch-data/create-order/CreateOrderData';
import GetChatChunkRes from '@/interfaces/responses/chats/GetChatChunkRes';
import axios from 'axios';
import GetPairsPagesAmountRes from '@/interfaces/responses/dex/GetPairsPagesAmountRes';
import { PairSortOption } from '@/interfaces/enum/pair';
import { GetUserOrdersData } from '@/interfaces/fetch-data/get-user-orders/GetUserOrdersData';
import GetUserOrdersAllPairsRes from '@/interfaces/responses/orders/GetUserOrdersAllPairsRes';
import { CancelAllData } from '@/interfaces/fetch-data/cancel-all-orders/CancelAllData';
import CancelAllRes from '@/interfaces/responses/orders/CancelAllRes';
import AuthParams from '@/interfaces/common/AuthParams';
import OrderRow from '@/interfaces/common/OrderRow';
import UserPendingType from '@/interfaces/common/UserPendingType';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import * as v2 from '@/utils/v2/client';

export async function getUser({ token }: AuthParams): Promise<ErrorRes | GetUserRes> {
	return axios
		.post('/api/user/get-user', {
			token,
		})
		.then((res) => res.data);
}

export async function checkAdmin({ token }: AuthParams): Promise<boolean> {
	return axios
		.post('/api/admin/check-admin', { token })
		.then((res) => !!res.data?.success)
		.catch(() => false);
}

export async function getConfig(): Promise<ErrorRes | GetConfigRes> {
	return axios.get('/api/config').then((res) => res.data);
}

export async function updateOffer(
	offerData: UpdateOfferData,
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true }> {
	return axios
		.post('/api/offers/update', {
			token,
			offerData,
		})
		.then((res) => res.data);
}

export async function deleteOffer(
	number: string,
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true }> {
	return axios
		.post('/api/offers/delete', {
			token,
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
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true }> {
	return axios
		.post('/api/user/set-favourite-currencies', {
			token,
			data: currs,
		})
		.then((res) => res.data);
}

export async function createChat(
	number: string,
	pay: string,
	receive: string,
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true; data: number }> {
	return axios
		.post('/api/chats/create', {
			token,
			number,
			chatData: {
				pay,
				receive,
			},
		})
		.then((res) => res.data);
}

export async function getChat(id: string, { token }: AuthParams): Promise<ErrorRes | GetChatRes> {
	return axios
		.post('/api/chats/get-chat', {
			token,
			id,
		})
		.then((res) => res.data);
}

export async function getAllChats({ token }: AuthParams): Promise<ErrorRes | GetAllChatsRes> {
	return axios
		.post('/api/chats/get-all-chats', {
			token,
		})
		.then((res) => res.data);
}

export async function deleteChat(
	id: string,
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true; data?: undefined }> {
	return axios
		.post('/api/chats/delete-chat', {
			token,
			id,
		})
		.then((res) => res.data);
}

export async function getPairsPage(
	page: number,
	searchText: string,
	whitelistedOnly: boolean,
	sortOption: PairSortOption,
): Promise<ErrorRes | (GetPairsPageRes & { hasMore: boolean })> {
	return v2.getPairsPage(page, searchText, whitelistedOnly, sortOption);
}

export async function getPairsPagesAmount(
	searchText: string,
	whitelistedOnly: boolean,
): Promise<ErrorRes | GetPairsPagesAmountRes> {
	return v2.getPairsPagesAmount(searchText, whitelistedOnly);
}

export async function getPair(id: string): Promise<ErrorRes | GetPairRes> {
	return v2.getPair(id);
}

export async function createOrder(
	orderData: CreateOrderData,
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true; data: OrderRow & { immediateMatch?: boolean } }> {
	return v2.createOrder(orderData, token);
}

export async function getOrdersPage(pairId: string): Promise<ErrorRes | GetOrdersPageRes> {
	return v2.getOrdersPage(pairId);
}

export async function getUserOrdersPage(
	pairId: string,
	{ token }: AuthParams,
): Promise<ErrorRes | GetUserOrdersPageRes> {
	return v2.getUserOrdersPage(pairId, token);
}

export async function getUserOrders(
	data: GetUserOrdersData,
	{ token }: AuthParams,
): Promise<ErrorRes | GetUserOrdersRes> {
	return v2.getUserOrders(data, token);
}

export async function getUserOrdersAllPairs({
	token,
}: AuthParams): Promise<ErrorRes | GetUserOrdersAllPairsRes> {
	return v2.getUserOrdersAllPairs(token);
}

export async function cancelOrder(
	id: string,
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true }> {
	return v2.cancelOrder(id, token);
}

export async function cancelTransaction(
	id: string,
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true }> {
	return v2.rejectSwapProposal(id, token);
}

export async function getCandles(
	pairId: string,
	period: Period,
): Promise<ErrorRes | GetCandlesRes> {
	return v2.getCandles(pairId, period);
}

export async function getPairStats(pairId: string): Promise<ErrorRes | GetPairStatsRes> {
	return v2.getPairStats(pairId);
}

export async function applyOrder(
	orderData: ApplyOrderData,
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true }> {
	return v2.createSwapProposal(
		{
			myOrderId: orderData.connected_order_id,
			counterOrderId: orderData.id,
			hexRawProposal: orderData.hex_raw_proposal,
			baseAmountInAtomics: orderData.base_amount_in_atomics,
			quoteAmountInAtomics: orderData.quote_amount_in_atomics,
		},
		token,
	);
}

export async function cancelAllOrders(
	data: CancelAllData,
	{ token }: AuthParams,
): Promise<ErrorRes | CancelAllRes> {
	return v2.cancelAllOrders(data, token);
}

export async function confirmTransaction(
	transactionId: string,
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true }> {
	return v2.acceptSwapProposal(transactionId, token);
}

export async function getChatChunk(
	chatId: string,
	chunkNumber: number,
	{ token }: AuthParams,
): Promise<ErrorRes | GetChatChunkRes> {
	return axios
		.post('/api/chats/get-chat-chunk', {
			token,
			id: chatId,
			chunkNumber,
		})
		.then((res) => res.data);
}

export async function getTrades(
	_pairId: string,
): Promise<ErrorRes | { success: true; data: Trade[] }> {
	return { success: true, data: [] };
}

export async function getUserPendings(
	{ token }: AuthParams,
	pairId?: string,
): Promise<ErrorRes | { success: true; data: UserPendingType[] }> {
	return v2.getUserPendings(token, pairId);
}

export async function getZanoPrice() {
	return axios
		.get(
			'https://explorer.zano.org/api/price?asset_id=d6329b5b1f7c0805b5c345f4957554002a2f557845f64d7645dae0e051a6498a',
		)
		.then((res) => res.data);
}

export async function getNotificationSettings({
	token,
}: AuthParams): Promise<ErrorRes | { success: true; data: { email: string | null } }> {
	return axios
		.post('/api/user/get-notification-settings', { token }, { validateStatus: () => true })
		.then((res) => res.data);
}

export async function setAccountEmail(
	email: string | null,
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true; data: { email: string | null } }> {
	return axios
		.post('/api/user/set-email', { token, email }, { validateStatus: () => true })
		.then((res) => res.data);
}

export async function setOrderEmailNotifications(
	orderId: string | number,
	enabled: boolean,
	{ token }: AuthParams,
): Promise<ErrorRes | { success: true; data: { enabled: boolean } }> {
	return axios
		.post(
			'/api/orders/set-email-notifications',
			{ token, orderId: Number(orderId), enabled },
			{ validateStatus: () => true },
		)
		.then((res) => res.data);
}

export async function getAssetExplorerPrice(
	assetId: string,
): Promise<{ success: boolean; data?: { zano_price?: number | null; usd?: number | null } }> {
	return axios
		.get('https://explorer.zano.org/api/price', { params: { asset_id: assetId } })
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
