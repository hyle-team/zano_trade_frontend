import { CSSProperties, ChangeEvent, KeyboardEventHandler, WheelEventHandler } from 'react';

interface InputProps {
	className?: string;
	type?: 'text' | 'number';
	min?: string;
	max?: string;
	placeholder?: string;
	onInput?: (_e: ChangeEvent<HTMLInputElement>) => void;
	onWheel?: WheelEventHandler<HTMLInputElement>;
	value: string | number;
	onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
	disabled?: boolean;
	maxLength?: number;
	bordered?: boolean;
	readOnly?: boolean;
	style?: CSSProperties;
}

export default InputProps;
