import { Dispatch, SetStateAction } from 'react';
import SelectValue from '@/interfaces/states/pages/dex/trading/InputPanelItem/SelectValue';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';

export interface OrdersPoolProps {
	ordersBuySell: SelectValue;
	setOrdersBuySell: Dispatch<SetStateAction<SelectValue>>;
	currencyNames: {
		firstCurrencyName: string;
		secondCurrencyName: string;
	};
	ordersLoading: boolean;
	filteredOrdersHistory: PageOrderData[];
	secondAssetUsdPrice: number | undefined;
	takeOrderClick: (
		_event:
			| React.MouseEvent<HTMLAnchorElement, MouseEvent>
			| React.MouseEvent<HTMLTableRowElement, MouseEvent>,
		_e: PageOrderData,
	) => void;
}
