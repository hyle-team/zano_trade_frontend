import OfferData from '@/interfaces/responses/offers/OfferData';
import { UserChatData } from '@/interfaces/responses/user/GetUserRes';

type OffersStateElement = OfferData | (UserChatData & { alias: string; address: string });

export default OffersStateElement;
