import OfferType from '@/interfaces/common/OfferType';

interface GetPageData {
	type: OfferType;
	page: number;
	input_currency_id?: string;
	target_currency_id?: string;
	price?: string;
	priceDescending?: boolean;
}

export default GetPageData;
