import OfferData from './OfferData';

interface GetPageRes {
	success: true;
	data: {
		pages: number;
		offers: OfferData[];
	};
}

export default GetPageRes;
