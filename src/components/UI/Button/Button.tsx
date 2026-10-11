import ButtonProps from '@/interfaces/props/components/UI/Button/ButtonProps';
import { classes } from '@/utils/utils';
import styles from './Button.module.scss';

function Button(props: ButtonProps) {
	const { variant, size, block, loading } = props;

	return (
		<button
			type={props.type}
			title={props.title}
			aria-label={props['aria-label']}
			style={props.style}
			onClick={props.onClick}
			className={classes(
				styles.button,
				props.transparent && styles.transparent,
				variant && styles.variant,
				variant && styles[variant],
				size === 'sm' && styles.sm,
				block && styles.block,
				props.className,
				props.noBorder && styles.btn__no_border,
			)}
			onMouseEnter={props.onMouseEnter}
			onMouseLeave={props.onMouseLeave}
			disabled={props.disabled || loading}
		>
			{loading && <span className={styles.spinner} />}
			{props.children}
		</button>
	);
}

export default Button;
