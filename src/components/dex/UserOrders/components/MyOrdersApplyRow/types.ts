import ApplyTip from '@/interfaces/common/ApplyTip';
import MatrixAddress from '@/interfaces/common/MatrixAddress';
import OrderRow from '@/interfaces/common/OrderRow';
import PairData from '@/interfaces/common/PairData';

export interface MyOrdersApplyRowProps {
	orderData: ApplyTip;
	secondAssetUsdPrice: number | undefined;
	updateOrders: () => Promise<void>;
	updateUserOrders: () => Promise<void>;
	fetchUser: () => Promise<boolean>;
	fetchTrades: () => Promise<void>;
	matrixAddresses: MatrixAddress[];
	pairData: PairData | null;
	userOrders: OrderRow[];
}
