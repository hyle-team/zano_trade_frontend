import StatItemProps from '@/interfaces/props/pages/dex/trading/StatItemProps';
import { classes } from '@/utils/utils';
import styles from './styles.module.scss';

function StatItem({ Img, title, value, className, coefficient }: StatItemProps) {
	return (
		<div className={classes(styles.statItem, className)}>
			<div className={styles.statItem__nav}>
				<Img />
				<p className={styles.statItem__nav_title}>{title}</p>
			</div>

			<div className={styles.statItem__content}>
				<p className={styles.statItem__content_val}>{value}</p>

				{coefficient !== undefined && (
					<p
						className={classes(
							styles.statItem__content_coefficient,
							coefficient >= 0 ? styles.green : styles.red,
						)}
					>
						{coefficient >= 0 ? '+' : ''}
						{coefficient?.toFixed(2)}%
					</p>
				)}
			</div>
		</div>
	);
}

export default StatItem;
