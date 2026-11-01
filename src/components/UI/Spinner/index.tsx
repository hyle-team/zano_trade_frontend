import { classes } from '@/utils/utils';
import styles from './styles.module.scss';

interface SpinnerProps {
	size?: 'sm' | 'md';
	className?: string;
}

const Spinner = ({ size = 'md', className }: SpinnerProps) => (
	<span className={classes(styles.spinner, styles[size], className)} role="status" />
);

export default Spinner;
