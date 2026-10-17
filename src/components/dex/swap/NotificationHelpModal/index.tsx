import { useEffect, useState } from 'react';
import Modal from '@/components/UI/Modal';
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	BellIcon,
	LockIcon,
	ReloadIcon,
	SlidersIcon,
} from '@/components/UI/Icons';
import styles from './styles.module.scss';

interface NotificationHelpModalProps {
	open: boolean;
	onClose: () => void;
}

const NotificationHelpModal = ({ open, onClose }: NotificationHelpModalProps) => {
	const [host, setHost] = useState('trade.zano.org');

	useEffect(() => {
		setHost(window.location.host);
	}, []);

	return (
		<Modal open={open} onClose={onClose} title="Allow notifications" className={styles.modal}>
			<div className={styles.body}>
				<div className={styles.browser} aria-hidden="true">
					<div className={styles.browser__bar}>
						<span className={styles.browser__nav}>
							<ArrowLeftIcon width={16} height={16} />
							<ArrowRightIcon width={16} height={16} />
							<ReloadIcon width={16} height={16} />
						</span>

						<span className={styles.browser__address}>
							<span className={styles.browser__settings}>
								<SlidersIcon width={16} height={16} />
							</span>
							<span className={styles.browser__host}>{host}</span>
						</span>
					</div>

					<div className={styles.browser__page}>
						<div className={styles.popover}>
							<p className={styles.popover__site}>Zano Trade</p>
							<div className={styles.popover__row}>
								<BellIcon width={18} height={18} />
								<span>Notifications</span>
								<span className={styles.popover__toggle} />
							</div>
						</div>
					</div>
				</div>

				<ol className={styles.steps}>
					<li>
						<span className={styles.steps__index}>1</span>
						<p>
							Click the
							<span className={styles.steps__icon}>
								<SlidersIcon width={14} height={14} />
							</span>
							or
							<span className={styles.steps__icon}>
								<LockIcon width={14} height={14} />
							</span>
							icon in the address bar.
						</p>
					</li>
					<li>
						<span className={styles.steps__index}>2</span>
						<p>Turn on Notifications for this site.</p>
					</li>
					<li>
						<span className={styles.steps__index}>3</span>
						<p>Come back to this tab — we will pick up the new setting.</p>
					</li>
				</ol>
			</div>
		</Modal>
	);
};

export default NotificationHelpModal;
