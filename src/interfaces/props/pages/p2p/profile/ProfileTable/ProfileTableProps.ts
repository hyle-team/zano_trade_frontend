import { CategoriesCode } from '@/interfaces/states/pages/p2p/profile/CategoriesState';
import OffersStateElement from '@/interfaces/states/pages/p2p/profile/OffersState';

interface ProfileTableProps {
	categoryState: CategoriesCode;
	offers: OffersStateElement[];
	preloaderState?: boolean;
}

export default ProfileTableProps;
