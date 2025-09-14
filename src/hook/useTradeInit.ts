import PairData from '@/interfaces/common/PairData';
import { Store } from '@/store/store-reducer';
import { useContext } from 'react';
import Decimal from 'decimal.js';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { ZANO_ASSET_ID } from '@/utils/utils';
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

	const firstCurrencyAssetID = pairData?.first_currency?.asset_id;

	const assets = state.wallet?.connected ? state.wallet?.assets || [] : [];
	const balance = assets.find((e) => e.assetId === firstCurrencyAssetID)?.balance;
	const zanoBalance = assets.find((e) => e.assetId === ZANO_ASSET_ID)?.balance || 0;

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
			? new Decimal(pairStats.rate).mul(secondAssetUsdPrice).toFixed(2)
			: undefined;

	const orderForm = useOrderForm({
		pairData,
		balance,
		assetsRates: state.assetsRates,
	});

	return {
		currencyNames,
		firstAssetLink,
		secondAssetLink,
		secondAssetUsdPrice,
		balance,
		zanoBalance,
		orderForm,
		pairRateUsd,
	};
};

export default useTradeInit;
