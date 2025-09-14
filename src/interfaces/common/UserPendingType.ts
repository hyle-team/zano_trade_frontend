interface UserPendingType {
	id: number;
	amount: string;
	price: string;
	finalizer: {
		address: string;
		alias: string;
		id: number;
		order_id: number;
	};
	buy_order_id: number;
	sell_order_id: number;
	creator: 'sell' | 'buy';
	hex_raw_proposal: string;
	status: string;
	timestamp: string;
}

export default UserPendingType;
