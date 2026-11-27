import { ReactNode } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button/Button';
import styles from './styles.module.scss';

interface ConfirmModalProps {
	open: boolean;
	title: string;
	description: ReactNode;
	confirmLabel: string;
	cancelLabel?: string;
	loading?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

const ConfirmModal = ({
	open,
	title,
	description,
	confirmLabel,
	cancelLabel = 'Keep it',
	loading,
	onConfirm,
	onClose,
}: ConfirmModalProps) => (
	<Modal open={open} onClose={loading ? () => undefined : onClose} title={title}>
		<div className={styles.body}>
			<p className={styles.body__text}>{description}</p>

			<div className={styles.body__actions}>
				<Button variant="secondary" block onClick={onClose} disabled={loading}>
					{cancelLabel}
				</Button>
				<Button variant="danger" block loading={loading} onClick={onConfirm}>
					{confirmLabel}
				</Button>
			</div>
		</div>
	</Modal>
);

export default ConfirmModal;
