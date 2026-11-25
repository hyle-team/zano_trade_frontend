import crossIcon from '@/assets/images/UI/cross_icon.svg?url';
import Button from '@/components/UI/Button/Button';
import { classes } from '@/utils/utils';
import { ConfirmPopupProps } from './types';
import styles from './styles.module.scss';

function ConfirmPopup(props: ConfirmPopupProps) {
	const {
		close,
		title,
		text,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		danger,
		onConfirm,
	} = props;

	return (
		<div className={styles.confirm__popup}>
			<div>
				<h5>{title}</h5>
				<img onClick={close} src={crossIcon} alt="close" />
			</div>
			<div>
				{text && <p>{text}</p>}

				<div className={styles.confirm__actions}>
					<Button transparent onClick={close}>
						{cancelText}
					</Button>
					<Button
						className={classes(danger && styles.confirm__danger)}
						onClick={onConfirm}
					>
						{confirmText}
					</Button>
				</div>
			</div>
		</div>
	);
}

export default ConfirmPopup;
