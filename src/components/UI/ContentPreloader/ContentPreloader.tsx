import Preloader from '@/components/UI/Preloader/Preloader';
import styles from './ContentPreloader.module.scss';

function ContentPreloader(props: { className?: string }) {
	return (
		<div className={`${styles.content__preloader__wrapper} ${props.className}`}>
			<div>
				<Preloader />
				<p>Loading...</p>
			</div>
		</div>
	);
}

export default ContentPreloader;
