import MatrixAddress from '@/interfaces/common/MatrixAddress';
import OrderRow from '@/interfaces/common/OrderRow';
import PairData from '@/interfaces/common/PairData';
import { ForwardedRef } from 'react';

export type OrderType = 'opened' | 'suitable' | 'requests' | 'offers' | 'history';
export type UserOrdersTabType = 'opened' | 'history';
export interface UserOrdersProps {
	orderListRef: ForwardedRef<HTMLDivElement>;
	userOrders: OrderRow[];
	myOrdersLoading: boolean;
	handleCancelAllOrders: () => void;
	secondAssetUsdPrice: number | undefined;
	matrixAddresses: MatrixAddress[];
	pairData: PairData | null;
	onAfter: () => Promise<void>;
	onOpenMyOrders: () => void;
	requestedTab?: UserOrdersTabType | null;
	onRequestedTabHandled?: () => void;
}
