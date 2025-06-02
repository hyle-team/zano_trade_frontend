import ApplyTip from '@/interfaces/common/ApplyTip';
import OrderRow from '@/interfaces/common/OrderRow';

interface GetUserOrdersPageRes {
	success: true;
	data: {
		orders: OrderRow[];
		applyTips: ApplyTip[];
	};
}

export default GetUserOrdersPageRes;
