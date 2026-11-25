import OrderRow from '@/interfaces/common/OrderRow';
import ApplyTip from '@/interfaces/common/ApplyTip';
import UserPendingType from '@/interfaces/common/UserPendingType';
import MatrixAddress from '@/interfaces/common/MatrixAddress';
import PairData from '@/interfaces/common/PairData';
import { OrderItemsKind } from '../../components/OrderItemsModal/types';

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
			data: OrderRow[];
			onOpenItems: (_kind: OrderItemsKind, _order: OrderRow) => void;
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
			data: OrderRow[];
	  });
