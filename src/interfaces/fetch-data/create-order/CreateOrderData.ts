import OfferType from '@/interfaces/common/OfferType';
import Side from '@/interfaces/common/Side';

interface CreateOrderData {
	type: OfferType;
	side: Side;
	price: string;
	amount: string;
	pairId: string;
}

export default CreateOrderData;
