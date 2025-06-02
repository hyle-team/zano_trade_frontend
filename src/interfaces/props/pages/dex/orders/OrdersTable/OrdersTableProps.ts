import AlertType from '@/interfaces/common/AlertType';
import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';
import { Dispatch, SetStateAction } from 'react';

interface OrdersTableProps {
	value: UserOrderData[];
	category: string;
	setAlertState: Dispatch<SetStateAction<AlertType>>;
	setAlertSubtitle: Dispatch<SetStateAction<string>>;
	setOrders: Dispatch<SetStateAction<UserOrderData[]>>;
}

export default OrdersTableProps;
