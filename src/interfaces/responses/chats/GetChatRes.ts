import CurrencyRow from '@/interfaces/common/CurrencyRow';
import DepositState from '@/interfaces/common/DepositState';
import OfferType from '@/interfaces/common/OfferType';
import UserData from '@/interfaces/common/UserData';

interface Message {
	id: string;
	type?: 'img';
	url?: string;
	text?: string;
	timestamp: string;
	fromOwner?: boolean;
	success: boolean;
	fail: boolean;
	system?: boolean;
}

interface ChatData {
	id: string;
	user_id: string;
	price: number;
	min: number;
	max: number;
	deposit_seller: number;
	deposit_buyer: number;
	type: OfferType;
	input_currency: CurrencyRow;
	target_currency: CurrencyRow;
	comment: string | null;
	number: string;
	offer_status: string;
	deposit_currency: CurrencyRow;
	timestamp: string;
	creator_data: UserData;
	buyer_data: UserData;

	offer_number: string;
	buyer_id: string;
	// chat_history: Message[];
	chunk_count: number;
	status: string;
	pay: number;
	receive: number;
	owner_deposit: DepositState;
	opponent_deposit: DepositState;
	view_list: string[];

	favourite_currencies?: undefined;
}

interface GetChatRes {
	success: true;
	data: ChatData;
}

export default GetChatRes;

export type { ChatData, Message };
