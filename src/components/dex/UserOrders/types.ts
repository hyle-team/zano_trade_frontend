import ApplyTip from '@/interfaces/common/ApplyTip';
import MatrixAddress from '@/interfaces/common/MatrixAddress';
import OrderRow from '@/interfaces/common/OrderRow';
import PairData from '@/interfaces/common/PairData';
import { ForwardedRef } from 'react';

export type OrderType = 'opened' | 'suitable' | 'requests' | 'offers' | 'history';
export interface UserOrdersProps {
	orderListRef: ForwardedRef<HTMLDivElement>;
	userOrders: OrderRow[];
	applyTips: ApplyTip[];
	myOrdersLoading: boolean;
	handleCancelAllOrders: () => void;
	secondAssetUsdPrice: number | undefined;
	matrixAddresses: MatrixAddress[];
	pairData: PairData | null;
	onAfter: () => Promise<void>;
}
