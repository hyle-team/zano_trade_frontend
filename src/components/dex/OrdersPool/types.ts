import { Dispatch, SetStateAction } from 'react';
import SelectValue from '@/interfaces/states/pages/dex/trading/InputPanelItem/SelectValue';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';

export interface OrdersPoolProps {
	ordersBuySell: SelectValue;
	secondAssetUsdPrice: number | undefined;
	setOrdersBuySell: Dispatch<SetStateAction<SelectValue>>;
	currencyNames: {
		firstCurrencyName: string;
		secondCurrencyName: string;
	};
	ordersLoading: boolean;
	ordersHistory: PageOrderData[];
	filteredOrdersHistory: PageOrderData[];
	trades: Trade[];
	tradesLoading: boolean;
	takeOrderClick: (
		_event: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
		_e: PageOrderData,
	) => void;
}
