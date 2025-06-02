import { ReactComponent as LockIcon } from '@/assets/images/UI/lock.svg';
import styles from './DepositTitle.module.scss';
import EmptyLink from '../EmptyLink/EmptyLink';

function DepositTitle(props: { className?: string }) {
	return (
		<div className={`${styles.deposit__title} ${props.className || ''}`}>
			<LockIcon />
			<EmptyLink>Deposit</EmptyLink>
		</div>
	);
}

export default DepositTitle;
