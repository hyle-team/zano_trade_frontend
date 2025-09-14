export interface CancelActionCellProps {
	type?: 'cancel' | 'reject' | 'cancel_tx';
	id: string;
	onAfter: () => Promise<void>;
}
