import OrderRow from '@/interfaces/common/OrderRow';

export interface OrderGroupHeaderProps {
	order?: OrderRow;
	firstCurrencyName: string;
	secondCurrencyName: string;
}
