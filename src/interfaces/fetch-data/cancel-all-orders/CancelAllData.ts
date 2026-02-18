export enum CancelAllBodyOrderType {
	BUY = 'buy',
	SELL = 'sell',
}

export type CancelAllData = {
	filterInfo: {
		pairId?: number;
		type?: CancelAllBodyOrderType;
		date?: {
			// UNIX timestamps in milliseconds
			from: number;
			to: number;
		};
	};
};
