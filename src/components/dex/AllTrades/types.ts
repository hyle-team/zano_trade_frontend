import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import { Dispatch, SetStateAction } from 'react';

type tradeType = 'all' | 'my';

export interface AllTradesProps {
	setTradesType: Dispatch<SetStateAction<tradeType>>;
	tradesType: tradeType;
	filteredTrades: Trade[];
	tradesLoading: boolean;
	currencyNames: {
		firstCurrencyName: string;
		secondCurrencyName: string;
	};
}
