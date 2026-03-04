export type GetUserOrdersAllPairsResPair = {
	id: number;
	firstCurrency: {
		id: number;
		ticker: string | null;
	};
	secondCurrency: {
		id: number;
		ticker: string | null;
	};
};

type GetUserOrdersAllPairsRes = {
	success: true;
	data: GetUserOrdersAllPairsResPair[];
};

export default GetUserOrdersAllPairsRes;
