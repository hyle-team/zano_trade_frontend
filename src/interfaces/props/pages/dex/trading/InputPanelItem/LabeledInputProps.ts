interface LabeledInputProps {
	label: string;
	value: string;
	setValue: (_value: string) => void;
	placeholder: string;
	currency: string;
	usd?: string;
	readonly?: boolean;
	invalid?: boolean;
}

export default LabeledInputProps;
