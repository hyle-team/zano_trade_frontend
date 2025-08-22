export interface CancelActionCellProps {
	type?: 'cancel' | 'reject';
	id: string;
	onAfter: () => Promise<void>;
}
