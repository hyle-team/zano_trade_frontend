import UserRow from '@/interfaces/common/UserRow';
import UserData from '@/interfaces/common/UserData';
import CurrencyRow from '@/interfaces/common/CurrencyRow';
import DepositState from '@/interfaces/common/DepositState';
import OfferType from '@/interfaces/common/OfferType';
import OfferData from '../offers/OfferData';

interface UserChatData {
	id: string;
	offer_number: string;
	status: string;
	pay: number;
	receive: number;
	owner_deposit: DepositState;
	opponent_deposit: DepositState;
	view_list: string[];
	creator_data: UserData;
	buyer_data: UserData;
	chat_history?: undefined;
	favourite_currencies?: undefined;
	user_id?: undefined;
	buyer_id?: undefined;
	input_currency: CurrencyRow;
	target_currency: CurrencyRow;
	deposit_currency: CurrencyRow;
	price: number;
	min: number;
	max: number;
	deposit_seller: number;
	deposit_buyer: number;
	type: OfferType;
	comment: string | null;
	number: string;
	offer_status: string;
	timestamp: string;
}

type GetUserResData = UserRow & {
	offers: OfferData[];
	chats: UserChatData[];
	exchange_notifications: number;
};

interface GetUserRes {
	success: true;
	data: GetUserResData;
}

export default GetUserRes;

export type { UserChatData, GetUserResData };
