interface UserPendingType {
	id: string;
	amount: string;
	price: string;
	finalizer: {
		address: string;
		alias: string;
		id: string;
		order_id: string;
	};
	buy_order_id: string;
	sell_order_id: string;
	creator: 'sell' | 'buy';
	hex_raw_proposal: string;
	status: string;
	timestamp: string;
}

export default UserPendingType;
