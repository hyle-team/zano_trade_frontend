import { Dispatch, SetStateAction } from 'react';
import OfferData from '../../../../../responses/offers/OfferData';

interface HomeTableProps {
	preloaderState: boolean;
	priceDescending: boolean;
	setPriceState: Dispatch<SetStateAction<boolean>>;
	offers: OfferData[];
}

export default HomeTableProps;
