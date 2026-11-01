import OfferType from './OfferType';

interface OrderRow {
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
	min_per_apply_amount: number | null;
	max_per_apply_amount: number | null;
	isInstant: boolean;
	email_notifications?: boolean;
}

export default OrderRow;
