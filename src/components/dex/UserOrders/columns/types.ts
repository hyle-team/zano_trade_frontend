import MatrixAddress from '@/interfaces/common/MatrixAddress';
import OrderRow from '@/interfaces/common/OrderRow';
import PairData from '@/interfaces/common/PairData';

export interface BuildUserColumnsArgs {
	firstCurrencyName: string;
	secondCurrencyName: string;
	secondAssetUsdPrice?: number;
	offersCountByOrderId: Map<string, number>;
	onAfter: () => Promise<void>;
}

export interface BuildApplyTipsColumnsArgs {
	type: 'suitables' | 'offers';
	firstCurrencyName: string;
	secondCurrencyName: string;
	matrixAddresses: MatrixAddress[];
	secondAssetUsdPrice?: number;
	userOrders: OrderRow[];
	pairData: PairData | null;
	onAfter: () => Promise<void>;
}

export interface BuildMyRequestsColumnsArgs {
	firstCurrencyName: string;
	secondCurrencyName: string;
	onAfter: () => Promise<void>;
}

export interface BuildOrderHistoryColumnsArgs {
	firstCurrencyName: string;
	secondCurrencyName: string;
	secondAssetUsdPrice?: number;
}
