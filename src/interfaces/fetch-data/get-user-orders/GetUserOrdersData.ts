export enum GetUserOrdersBodyStatus {
	ACTIVE = 'active',
	FINISHED = 'finished',
}

export enum GetUserOrdersBodyType {
	BUY = 'buy',
	SELL = 'sell',
}

export type GetUserOrdersData = {
	limit: number;
	offset: number;
	filterInfo: {
		pairId?: number;
		status?: GetUserOrdersBodyStatus;
		type?: GetUserOrdersBodyType;
		date?: {
			// UNIX timestamps in milliseconds
			from: number;
			to: number;
		};
	};
};
