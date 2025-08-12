import ApplyTip from '@/interfaces/common/ApplyTip';
import MatrixAddress from '@/interfaces/common/MatrixAddress';
import OrderRow from '@/interfaces/common/OrderRow';

export interface MyOrdersRowProps {
	orderData: OrderRow;
	secondAssetUsdPrice: number | undefined;
	updateOrders: () => Promise<void>;
	updateUserOrders: () => Promise<void>;
	fetchUser: () => Promise<boolean>;
	matrixAddresses: MatrixAddress[];
	applyTips: ApplyTip[];
}
