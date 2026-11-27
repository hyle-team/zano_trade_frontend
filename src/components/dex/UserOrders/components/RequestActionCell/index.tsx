import { useState } from 'react';

import ActionBtn from '@/components/UI/ActionBtn';
import { useOrderActions } from '@/hook/useOrderActions';
import { RequestActionCellProps } from './types';

export default function RequestActionCell({
	type = 'request',
	row,
	pairData,
	onAfter,
	connectedOrder,
	userOrders,
}: RequestActionCellProps) {
	const [loading, setLoading] = useState(false);
	const { acceptProposal, requestMatch, alertErr } = useOrderActions();

	const _connectedOrder =
		connectedOrder ?? userOrders?.find((o) => o.id === row.connected_order_id);

	const onClick = async () => {
		if (!row.transaction && !_connectedOrder) return;

		setLoading(true);

		let success = false;

		try {
			success = row.transaction
				? await acceptProposal(row, pairData)
				: await requestMatch(row, pairData ?? null);
		} catch (error) {
			console.error(error);
			alertErr('Unexpected error occurred. Please try again later.');
		} finally {
			setLoading(false);
		}

		if (success) await onAfter();
	};

	return (
		<ActionBtn variant="success" loading={loading} onClick={() => onClick()}>
			{type === 'request' ? 'Request' : 'Accept'}
		</ActionBtn>
	);
}
