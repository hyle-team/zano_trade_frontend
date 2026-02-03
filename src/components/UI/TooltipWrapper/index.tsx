import { classes } from '@/utils/utils';
import styles from './styles.module.scss';
import { TooltipWrapperProps } from './types';

const TooltipWrapper = ({ children, text, className }: TooltipWrapperProps) => {
	return (
		<div className={styles.tooltip}>
			{children}

			<div className={classes(styles.tooltip__text, className)}>{text}</div>
		</div>
	);
};

export default TooltipWrapper;
