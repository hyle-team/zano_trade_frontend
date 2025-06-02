import CurrencyRow from '@/interfaces/common/CurrencyRow';
import OfferType from '@/interfaces/common/OfferType';

interface OfferData {
	id: string;
	alias: string;
	address: string;
	price: number;
	min: number;
	max: number;
	deposit_seller: number;
	deposit_buyer: number;
	type: OfferType;
	input_currency: CurrencyRow;
	target_currency: CurrencyRow;
	comment: string | null;
	number: string;
	offer_status: string;
	deposit_currency: CurrencyRow;
	timestamp: string;
}

export default OfferData;
