import OfferData from '@/interfaces/responses/offers/OfferData';
import { Dispatch, SetStateAction } from 'react';

interface CreateOfferPopupProps {
	edit?: boolean;
	offerData?: OfferData;
	setPopupState: Dispatch<SetStateAction<boolean>>;
}

export default CreateOfferPopupProps;
