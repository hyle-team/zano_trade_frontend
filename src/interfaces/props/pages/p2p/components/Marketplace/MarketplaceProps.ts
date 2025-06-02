import { Dispatch, SetStateAction } from 'react';
import OfferData from '../../../../../responses/offers/OfferData';

interface MarketplaceProps {
	value: OfferData[];
	setValue: Dispatch<SetStateAction<OfferData[]>>;
}

export default MarketplaceProps;
