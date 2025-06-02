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
}

export default ApplyTip;
