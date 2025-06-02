import ButtonProps from '@/interfaces/props/components/UI/Button/ButtonProps';
import styles from './Button.module.scss';

function Button(props: ButtonProps) {
	return (
		<button
			style={props.style}
			onClick={props.onClick}
			className={`${styles.button} ${props.transparent ? styles.transparent : ''} ${props.className || ''} ${props.noBorder ? styles.btn__no_border : ''}`}
			onMouseEnter={props.onMouseEnter}
			onMouseLeave={props.onMouseLeave}
			disabled={props.disabled}
		>
			{props.children}
		</button>
	);
}

export default Button;
