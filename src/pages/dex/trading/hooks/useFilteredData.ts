import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import SelectValue from '@/interfaces/states/pages/dex/trading/InputPanelItem/SelectValue';
import { Store } from '@/store/store-reducer';
import { useContext } from 'react';

interface useFilteredDataParams {
	trades: Trade[];
	ordersHistory: PageOrderData[];
	ordersBuySell: SelectValue;
	tradesType: 'all' | 'my';
}

const useFilteredData = ({
	ordersHistory,
	trades,
	ordersBuySell,
	tradesType,
}: useFilteredDataParams) => {
	const { state } = useContext(Store);

	const filteredTrades =
		tradesType === 'my'
			? trades.filter(
					(trade) =>
						trade.buyer.address === state.wallet?.address ||
						trade.seller.address === state.wallet?.address,
				)
			: trades;

	const filteredOrdersHistory = ordersHistory
		?.filter((e) => (ordersBuySell.code === 'all' ? e : e.type === ordersBuySell.code))
		?.filter((e) => e.user.address !== state.wallet?.address)
		?.sort((a, b) => {
			if (ordersBuySell.code === 'buy') {
				return parseFloat(b.price.toString()) - parseFloat(a.price.toString());
			}
			return parseFloat(a.price.toString()) - parseFloat(b.price.toString());
		});

	return {
		filteredOrdersHistory,
		filteredTrades,
	};
};

export default useFilteredData;
