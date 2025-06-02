import CurrencyRow from '@/interfaces/common/CurrencyRow';
import OfferType from '@/interfaces/common/OfferType';

interface UserOrderData {
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
}

interface GetUserOrdersRes {
	success: true;
	data: UserOrderData[];
}

export default GetUserOrdersRes;

export type { UserOrderData };
