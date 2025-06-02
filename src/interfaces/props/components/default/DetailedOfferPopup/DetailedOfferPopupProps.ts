import OfferData from '@/interfaces/responses/offers/OfferData';
import { Dispatch, SetStateAction } from 'react';

interface DetailedOfferPopupProps {
	offerData: OfferData;
	setPopupState: Dispatch<SetStateAction<boolean>>;
}

export default DetailedOfferPopupProps;
