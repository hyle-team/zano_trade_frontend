import MatrixAddress from '@/interfaces/common/MatrixAddress';
import OrderRow from '@/interfaces/common/OrderRow';
import PairData from '@/interfaces/common/PairData';

export type OrderItemsKind = 'matches' | 'requests' | 'offers';

export interface OrderItemsModalProps {
	kind: OrderItemsKind | null;
	order: OrderRow | null;
	pairData: PairData | null;
	firstCurrencyName: string;
	secondCurrencyName: string;
	secondAssetUsdPrice?: number;
	matrixAddresses: MatrixAddress[];
	onClose: () => void;
	onAfter: () => Promise<void>;
	onCountsOutdated: () => void;
}
