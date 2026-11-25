import { classes } from '@/utils/utils';
import { ItemsCountCellProps } from './types';
import styles from './styles.module.scss';

export default function ItemsCountCell({ count, onClick, className }: ItemsCountCellProps) {
	if (count <= 0) {
		return <p className={classes(styles.count, className)}>0</p>;
	}

	return (
		<button
			type="button"
			className={classes(styles.count, styles.count_active, className)}
			onClick={onClick}
		>
			{count}
		</button>
	);
}
