import HorizontalSelectValue from '@/interfaces/common/HorizontalSelectValue';

type CategoriesCode = 'my-offers' | 'chats' | 'active' | 'finished';

interface CategoriesState extends HorizontalSelectValue {
	notifications: number;
	name: 'My offers' | 'Chats' | 'Active' | 'Finished';
	code: CategoriesCode;
}

export default CategoriesState;

export { type CategoriesCode };
