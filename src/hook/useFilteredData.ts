import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import SelectValue from '@/interfaces/states/pages/dex/trading/InputPanelItem/SelectValue';
import { Store } from '@/store/store-reducer';
import { useContext } from 'react';

interface useFilteredDataParams {
	ordersHistory: PageOrderData[];
	ordersBuySell: SelectValue;
}

const useFilteredData = ({ ordersHistory, ordersBuySell }: useFilteredDataParams) => {
	const { state } = useContext(Store);

	const filteredOrdersHistory = ordersHistory
		?.filter((e) => (ordersBuySell.code === 'all' ? e : e.type === ordersBuySell.code))
		?.filter((e) => e.user.address !== state.wallet?.address)
		?.filter((e) => parseFloat(e.left.toString()) !== 0)
		?.sort((a, b) => {
			if (ordersBuySell.code === 'buy') {
				return parseFloat(b.price.toString()) - parseFloat(a.price.toString());
			}
			return parseFloat(a.price.toString()) - parseFloat(b.price.toString());
		});

	return {
		filteredOrdersHistory,
	};
};

export default useFilteredData;
