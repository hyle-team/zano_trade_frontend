import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { classes } from '@/utils/utils';
import { figtree } from '@/utils/font';
import { CloseIcon } from '@/components/UI/Icons';
import styles from './styles.module.scss';

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title: ReactNode;
	children: ReactNode;
	className?: string;
}

const Modal = ({ open, onClose, title, children, className }: ModalProps) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (!open) return;

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};

		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		window.addEventListener('keydown', onKeyDown);

		return () => {
			document.body.style.overflow = prevOverflow;
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [open, onClose]);

	if (!mounted || !open) return null;

	return createPortal(
		<div
			className={classes(styles.overlay, figtree.variable, 'no-svg-style')}
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className={classes(styles.modal, className)} role="dialog" aria-modal="true">
				<div className={styles.modal__header}>
					<h3 className={styles.modal__title}>{title}</h3>
					<button className={styles.modal__close} onClick={onClose} aria-label="Close">
						<CloseIcon />
					</button>
				</div>
				{children}
			</div>
		</div>,
		document.body,
	);
};

export default Modal;
