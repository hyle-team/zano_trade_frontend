import PairData from '@/interfaces/common/PairData';
import { Store } from '@/store/store-reducer';
import { useContext } from 'react';
import Decimal from 'decimal.js';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { useOrderForm } from './useOrdereForm';

interface useTradeInitParams {
	pairData: PairData | null;
	pairStats: PairStats | null;
}

const useTradeInit = ({ pairData, pairStats }: useTradeInitParams) => {
	const { state } = useContext(Store);

	const currencyNames = {
		firstCurrencyName: pairData?.first_currency?.name || '',
		secondCurrencyName: pairData?.second_currency?.name || '',
	};
	const loggedIn = !!state.wallet?.connected;

	const assets = state.wallet?.connected ? state.wallet?.assets || [] : [];
	const balance = assets.find((e) => e.ticker === currencyNames.firstCurrencyName)?.balance;

	const firstAssetId = pairData ? pairData.first_currency?.asset_id : undefined;
	const secondAssetId = pairData ? pairData.second_currency?.asset_id : undefined;
	const firstAssetLink = firstAssetId
		? `https://explorer.zano.org/assets?asset_id=${encodeURIComponent(firstAssetId)}`
		: undefined;
	const secondAssetLink = secondAssetId
		? `https://explorer.zano.org/assets?asset_id=${encodeURIComponent(secondAssetId)}`
		: undefined;

	const secondAssetUsdPrice = state.assetsRates.get(secondAssetId || '');

	const pairRateUsd =
		pairStats?.rate !== undefined && secondAssetUsdPrice !== undefined
			? new Decimal(pairStats.rate)
					.mul(secondAssetUsdPrice)
					.toFixed(pairStats.rate < 0.1 ? 6 : 2)
			: undefined;

	const buyForm = useOrderForm({
		type: 'buy',
		pairData,
		balance,
		assetsRates: state.assetsRates,
	});

	const sellForm = useOrderForm({
		type: 'sell',
		pairData,
		balance,
		assetsRates: state.assetsRates,
	});

	return {
		currencyNames,
		firstAssetLink,
		secondAssetLink,
		secondAssetUsdPrice,
		loggedIn,
		balance,
		buyForm,
		sellForm,
		pairRateUsd,
	};
};

export default useTradeInit;
