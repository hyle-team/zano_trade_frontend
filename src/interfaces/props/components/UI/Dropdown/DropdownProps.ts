import DropdownRow from '@/interfaces/common/DropdownRow';
import { ReactElement } from 'react';

interface DropdownProps<T extends DropdownRow> {
	value: DropdownRow;
	setValue: (_e: T) => void;
	maxItems?: number;
	defaultOpen?: boolean;
	selfContained?: boolean;
	body: T[];
	withImages?: boolean;
	noStars?: boolean;
	className?: string;
	withSearch?: boolean;
	icon?: ReactElement;
}

export default DropdownProps;
