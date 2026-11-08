import { V2ToBeTraded } from '@/utils/v2/types';
import OfferType from './OfferType';
import UserData from './UserData';

interface ApplyTip {
	id: string;
	left: number;
	price: number;
	user: UserData;
	timestamp?: string;
	type: OfferType;
	total: number;
	connected_order_id: string;
	transaction: boolean;
	hex_raw_proposal?: string;
	isInstant: boolean;
	to_be_traded?: V2ToBeTraded;
}

export default ApplyTip;
