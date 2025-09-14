import { useState } from 'react';
import { useAlert } from '@/hook/useAlert';
import { cancelOrder, cancelTransaction } from '@/utils/methods';
import ActionBtn from '@/components/UI/ActionBtn';
import { CancelActionCellProps } from './types';

export default function CancelActionCell({ type = 'cancel', id, onAfter }: CancelActionCellProps) {
	const [loading, setLoading] = useState(false);
	const { setAlertState, setAlertSubtitle } = useAlert();

	const onClick = async () => {
		if (loading) return;

		try {
			setLoading(true);
			const result = type === 'cancel' ? await cancelOrder(id) : await cancelTransaction(id);
			if (!result.success) {
				setAlertState('error');
				setAlertSubtitle('Error while cancelling order');
				setTimeout(() => {
					setAlertState(null);
					setAlertSubtitle('');
				}, 3000);
				return;
			}
			await onAfter();
		} finally {
			setLoading(false);
		}
	};

	return (
		<ActionBtn
			variant={type === 'reject' ? 'danger' : 'primary'}
			disabled={loading}
			onClick={() => onClick()}
		>
			{type === 'cancel' || type === 'cancel_tx' ? 'Cancel' : 'Reject'}
		</ActionBtn>
	);
}
