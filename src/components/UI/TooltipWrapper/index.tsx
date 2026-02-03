import styles from './styles.module.scss';
import { TooltipWrapperProps } from './types';

const TooltipWrapper = ({ children, text }: TooltipWrapperProps) => {
	return (
		<div className={styles.tooltip}>
			{children}

			<div className={styles.tooltip__text}>{text}</div>
		</div>
	);
};

export default TooltipWrapper;
