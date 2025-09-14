export interface Trade {
	id: number;
	timestamp: number;
	amount: string;
	price: string;
	type: string;
	buyer: {
		address: string;
		amount: string;
	};
	seller: {
		address: string;
		amount: string;
	};
}
