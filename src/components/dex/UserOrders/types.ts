import ApplyTip from '@/interfaces/common/ApplyTip';
import MatrixAddress from '@/interfaces/common/MatrixAddress';
import OrderRow from '@/interfaces/common/OrderRow';
import PairData from '@/interfaces/common/PairData';
import { Dispatch, ForwardedRef, SetStateAction } from 'react';

export interface UserOrdersProps {
	orderListRef: ForwardedRef<HTMLDivElement>;
	userOrders: OrderRow[];
	applyTips: ApplyTip[];
	myOrdersLoading: boolean;
	loggedIn: boolean;
	ordersType: 'opened' | 'history';
	setOrdersType: Dispatch<SetStateAction<'opened' | 'history'>>;
	handleCancelAllOrders: () => void;
	secondAssetUsdPrice: number | undefined;
	updateOrders: () => Promise<void>;
	updateUserOrders: () => Promise<void>;
	fetchTrades: () => Promise<void>;
	matrixAddresses: MatrixAddress[];
	pairData: PairData | null;
}
