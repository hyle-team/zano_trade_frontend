import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { Dispatch, SetStateAction } from 'react';

export interface OrdersRowProps {
	orderData: PageOrderData;
	percentage: number;
	takeOrderClick: (
		_event:
			| React.MouseEvent<HTMLAnchorElement, MouseEvent>
			| React.MouseEvent<HTMLTableRowElement, MouseEvent>,
		_e: PageOrderData,
	) => void;
	setOrdersInfoTooltip: Dispatch<SetStateAction<PageOrderData | null>>;
}
