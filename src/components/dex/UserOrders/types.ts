import ApplyTip from '@/interfaces/common/ApplyTip';
import MatrixAddress from '@/interfaces/common/MatrixAddress';
import OrderRow from '@/interfaces/common/OrderRow';
import PairData from '@/interfaces/common/PairData';
import { Dispatch, ForwardedRef, SetStateAction } from 'react';

export type OrderType = 'opened' | 'suitable' | 'requests' | 'offers' | 'history';

export type tabsType = {
	title: string;
	type: OrderType;
	length: number;
};

export interface UserOrdersProps {
	orderListRef: ForwardedRef<HTMLDivElement>;
	userOrders: OrderRow[];
	applyTips: ApplyTip[];
	myOrdersLoading: boolean;
	ordersType: OrderType;
	setOrdersType: Dispatch<SetStateAction<OrderType>>;
	handleCancelAllOrders: () => void;
	secondAssetUsdPrice: number | undefined;
	updateOrders: () => Promise<void>;
	updateUserOrders: () => Promise<void>;
	fetchTrades: () => Promise<void>;
	matrixAddresses: MatrixAddress[];
	pairData: PairData | null;
}
