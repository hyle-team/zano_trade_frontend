import HorizontalSelectValue from '@/interfaces/common/HorizontalSelectValue';
import { Dispatch, SetStateAction } from 'react';

interface HorizontalSelectProps<T extends HorizontalSelectValue> {
	withNotifications?: boolean;
	body: T[];
	value: T;
	setValue: Dispatch<SetStateAction<T>>;
	className?: string;
	isTab?: boolean;
}

export default HorizontalSelectProps;
