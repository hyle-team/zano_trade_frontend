import OfferType from '@/interfaces/common/OfferType';

interface UpdateOfferData {
	price: string;
	min: string;
	max: string;
	deposit_seller: string;
	deposit_buyer: string;
	type: OfferType;
	comment?: string;
	input_currency_id: string;
	target_currency_id: string;
	deposit_currency_id: string;
	number?: string;
}

export default UpdateOfferData;
