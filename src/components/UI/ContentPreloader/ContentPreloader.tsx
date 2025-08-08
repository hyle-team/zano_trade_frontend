import Preloader from '@/components/UI/Preloader/Preloader';
import { classes } from '@/utils/utils';
import styles from './ContentPreloader.module.scss';
import { ContentPreloaderProps } from './types';

function ContentPreloader({ className, style }: ContentPreloaderProps) {
	return (
		<div style={style} className={classes(styles.loader, className)}>
			<div className={styles.loader__content}>
				<Preloader />

				<p className={styles.loder__text}>Loading...</p>
			</div>
		</div>
	);
}

export default ContentPreloader;
