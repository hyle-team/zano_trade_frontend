import CandleRow from '@/interfaces/common/CandleRow';
import PairData from '@/interfaces/common/PairData';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';

export interface TradingProps {
	initialPair: PairData | null;
	initialStats: PairStats | null;
	initialOrders: PageOrderData[];
	initialTrades: Trade[];
	initialCandles: CandleRow[];
}
