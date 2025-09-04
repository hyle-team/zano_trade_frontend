import OrderRow from '@/interfaces/common/OrderRow';
import ApplyTip from '@/interfaces/common/ApplyTip';
import UserPendingType from '@/interfaces/common/UserPendingType';
import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';
import MatrixAddress from '@/interfaces/common/MatrixAddress';
import PairData from '@/interfaces/common/PairData';

export type CardsType = 'orders' | 'matches' | 'offers' | 'requests' | 'history';

type Common = {
	firstCurrencyName: string;
	secondCurrencyName: string;
	secondAssetUsdPrice?: number;
	onAfter: () => Promise<void>;
};

export type UniversalCardsProps =
	| (Common & {
			type: 'orders';
			data: OrderRow[] | UserOrderData[];
			matchesCountByOrderId: Record<string, number>;
			requestsCountByOrderId: Record<string, number>;
			offersCountByOrderId: Record<string, number>;
	  })
	| (Common & {
			type: 'matches' | 'offers';
			data: ApplyTip[];
			matrixAddresses: MatrixAddress[];
			userOrders: OrderRow[] | undefined;
			pairData: PairData | null;
	  })
	| (Common & {
			type: 'requests';
			data: UserPendingType[];
			matrixAddresses: MatrixAddress[];
	  })
	| (Common & {
			type: 'history';
			data: UserOrderData[];
	  });
