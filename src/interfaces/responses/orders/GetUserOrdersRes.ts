import CurrencyRow from '@/interfaces/common/CurrencyRow';
import OfferType from '@/interfaces/common/OfferType';

export type GetUserOrdersResCurrency = {
	id: number;
	name: string;
	code: string;
	type: string;
	asset_id: string;
	auto_parsed: boolean;
	asset_info?: {
		asset_id: string;
		logo: string;
		price_url: string;
		ticker: string;
		full_name: string;
		total_max_supply: string;
		current_supply: string;
		decimal_point: number;
		meta_info: string;
	};
	whitelisted: boolean;
};

export interface UserOrderData {
	id: string;
	type: OfferType;
	timestamp: string;
	side: string;
	price: number;
	amount: number;
	total: number;
	pair_id: string;
	user_id: string;
	status: string;
	left: number;
	first_currency: CurrencyRow;
	second_currency: CurrencyRow;

	pair: {
		id: number;
		first_currency_id: number;
		second_currency_id: number;
		rate?: number;
		coefficient?: number;
		high?: number;
		low?: number;
		volume: number;
		featured: boolean;

		first_currency: GetUserOrdersResCurrency;
		second_currency: GetUserOrdersResCurrency;
	};
}

interface GetUserOrdersRes {
	success: true;
	totalItemsCount: number;
	data: UserOrderData[];
}

export default GetUserOrdersRes;
