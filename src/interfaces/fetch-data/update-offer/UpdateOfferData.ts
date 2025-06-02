import OfferType from '@/interfaces/common/OfferType';

interface UpdateOfferData {
	price: number;
	min: number;
	max: number;
	deposit_seller: number;
	deposit_buyer: number;
	type: OfferType;
	comment?: string;
	input_currency_id: string;
	target_currency_id: string;
	deposit_currency_id: string;
	number?: string;
}

export default UpdateOfferData;
