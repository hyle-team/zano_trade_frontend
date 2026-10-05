export interface ConfirmPopupProps {
	close: () => void;
	title: string;
	text?: string;
	confirmText?: string;
	cancelText?: string;
	danger?: boolean;
	onConfirm: () => void;
}
