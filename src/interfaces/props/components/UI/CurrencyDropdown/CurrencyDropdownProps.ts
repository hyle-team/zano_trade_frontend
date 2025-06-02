import CurrencyContentRow from '@/interfaces/common/CurrencyContentRow';
import CurrencyRow from '@/interfaces/common/CurrencyRow';

interface CurrencyDropdownProps {
	value: CurrencyRow | null;
	setValue: (_e: CurrencyRow) => void;
	className?: string;
	withAll?: boolean;
	noStars?: boolean;
	content: CurrencyContentRow[];
}

export default CurrencyDropdownProps;
