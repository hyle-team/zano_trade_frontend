import PairData from '@/interfaces/common/PairData';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';

export interface TradingHeaderProps {
	pairStats: PairStats | null;
	pairRateUsd: string | undefined;
	firstAssetLink?: string;
	secondAssetLink?: string;
	firstAssetId?: string | null;
	secondAssetId?: string | null;
	pairData: PairData | null;
}
