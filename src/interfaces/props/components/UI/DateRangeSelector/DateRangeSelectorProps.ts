import DateState from '@/interfaces/common/DateState';

interface DateRangeSelectorProps {
	value: DateState;
	setValue: (_e: DateState) => void;
	className?: string;
	disabled?: boolean;
}

export default DateRangeSelectorProps;
