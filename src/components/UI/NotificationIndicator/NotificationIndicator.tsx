import styles from './NotificationIndicator.module.scss';

function NotificationIndicator(props: { count?: number; className?: string }) {
	const { className } = props;
	return props.count ? (
		<div className={`${styles.notification_indicator} ${className || ''}`}>
			<span className={styles.notification_indicator__count}>{props.count}</span>
		</div>
	) : (
		<></>
	);
}

export default NotificationIndicator;
