import OfferType from '@/interfaces/common/OfferType';

interface GetPageData {
	type: OfferType;
	page: number;
	input_currency_id?: string;
	target_currency_id?: string;
	price?: number;
	priceDescending?: boolean;
}

export default GetPageData;
