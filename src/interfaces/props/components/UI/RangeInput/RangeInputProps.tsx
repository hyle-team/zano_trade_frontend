import { ChangeEvent } from 'react';

interface RangeInputProps {
	value: string;
	onInput: (_e: ChangeEvent<HTMLInputElement>) => void;
	min?: number;
	max?: number;
	disabled?: boolean;
	className?: string;
}

export default RangeInputProps;
