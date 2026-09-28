interface LabeledInputProps {
	label: string;
	value: string;
	setValue: (_value: string) => void;
	currency: string;
	readonly?: boolean;
	invalid?: boolean;
	errorText?: string;
}

export default LabeledInputProps;
