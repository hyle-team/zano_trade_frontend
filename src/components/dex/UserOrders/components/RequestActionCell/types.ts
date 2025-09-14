import ApplyTip from '@/interfaces/common/ApplyTip';
import OrderRow from '@/interfaces/common/OrderRow';
import PairData from '@/interfaces/common/PairData';

export interface RequestActionCellProps {
	type?: 'request' | 'accept';
	row: ApplyTip;
	pairData: PairData | null;
	onAfter: () => Promise<void>;
	connectedOrder?: OrderRow;
	userOrders?: OrderRow[];
}
