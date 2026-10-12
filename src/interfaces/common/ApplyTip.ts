import OfferType from './OfferType';
import UserData from './UserData';

interface ApplyTip {
	id: string;
	left: string;
	price: string;
	user: UserData;
	timestamp?: string;
	type: OfferType;
	total: string;
	connected_order_id: string;
	transaction: boolean;
	hex_raw_proposal?: string;
	isInstant: boolean;
}

export default ApplyTip;
