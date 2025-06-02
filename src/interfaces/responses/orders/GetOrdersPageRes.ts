import PairData from '@/interfaces/common/PairData';
import UserData from '@/interfaces/common/UserData';
import OrderRow from '@/interfaces/common/OrderRow';

interface PageOrderData extends OrderRow {
	user: UserData;
}

interface OrderDataWithPair extends OrderRow {
	pair: PairData;
}

interface GetOrdersPageRes {
	success: true;
	data: PageOrderData[];
}

export default GetOrdersPageRes;

export type { PageOrderData, OrderDataWithPair };
