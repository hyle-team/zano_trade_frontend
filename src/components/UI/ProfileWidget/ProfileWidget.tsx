import { shortenAddress } from '@/utils/utils';
import Link from 'next/link';
import ProfileWidgetProps from '@/interfaces/props/components/UI/ProfileWidget/ProfileWidget';
import styles from './ProfileWidget.module.scss';

function ProfileWidget(props: ProfileWidgetProps) {
	return (
		<div className={styles.profile__widget}>
			<div
				style={props.offerData?.hash ? { height: '54px', width: '54px' } : {}}
				className={styles.profile__widget__avatar}
			>
				<p style={props.offerData?.hash ? { fontSize: '24px' } : {}}>
					{props.offerData.alias ? props.offerData.alias[0] : 'n'}
				</p>
			</div>
			<div
				style={props.offerData?.hash ? { height: '54px' } : {}}
				className={styles.profile__widget__content}
			>
				<div
					className={`${styles.profile__widget__title} ${props.offerData?.hash ? styles.widget__hashed : ''}`}
				>
					{props.withLink ? (
						<Link href="/">@{props.offerData.alias || 'no alias'}</Link>
					) : (
						<p>@{props.offerData.alias || 'no alias'}</p>
					)}
					{props.offerData?.hash && (
						<p className={styles.profile__widget__hash}>{props.offerData?.hash}</p>
					)}
				</div>
				<div className={styles.profile__widget__description}>
					<p>{shortenAddress(props.offerData.address, 6, 6)}</p>
				</div>
			</div>
		</div>
	);
}

export default ProfileWidget;
