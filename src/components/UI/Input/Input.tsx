import InputProps from '@/interfaces/props/components/UI/Input/InputProps';
import styles from './Input.module.scss';

function Input(props: InputProps) {
	let inputClass = styles.input__range;

	if (!props.type || props.type === 'text' || props.type === 'number') {
		inputClass = props.bordered ? styles.input__bordered : styles.input__default;
	}

	return (
		<input
			min={props.min}
			max={props.max}
			readOnly={props.readOnly}
			className={`${styles.input} ${inputClass} ${props.className || ''}`}
			type={props.type}
			placeholder={props.placeholder || ''}
			onInput={props.onInput}
			onWheel={
				props.onWheel ||
				(props.type === 'number' ? (e) => (e.target as HTMLInputElement).blur() : undefined)
			}
			value={props.value}
			onKeyDown={props.onKeyDown}
			disabled={props.disabled}
			maxLength={props.maxLength}
			style={props.style}
		/>
	);
}

export default Input;
