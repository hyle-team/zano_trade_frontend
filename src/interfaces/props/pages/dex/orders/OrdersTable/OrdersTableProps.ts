import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';

interface OrdersTableProps {
	value: UserOrderData[];
	category: string;
	deleteOrder: (orderId: string) => Promise<void>;
}

export default OrdersTableProps;
