import Spinner from '@/components/UI/Spinner';
import { classes } from '@/utils/utils';
import styles from './ContentPreloader.module.scss';
import { ContentPreloaderProps } from './types';

function ContentPreloader({ className, style }: ContentPreloaderProps) {
	return (
		<div style={style} className={classes(styles.loader, className)}>
			<Spinner />
		</div>
	);
}

export default ContentPreloader;
