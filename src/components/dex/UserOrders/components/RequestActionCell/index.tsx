import Link from 'next/link';
import Decimal from 'decimal.js';
import { useState, useContext } from 'react';
import { Store } from '@/store/store-reducer';
import { useAlert } from '@/hook/useAlert';
import { applyOrder, confirmTransaction } from '@/utils/methods';
import { confirmIonicSwap, ionicSwap } from '@/utils/wallet';
import { updateAutoClosedNotification } from '@/store/actions';
import { notationToString } from '@/utils/utils';
import ActionBtn from '@/components/UI/ActionBtn';
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
	const { state, dispatch } = useContext(Store);
	const { setAlertState, setAlertSubtitle } = useAlert();

	const _connectedOrder =
		connectedOrder ?? userOrders?.find((o) => o.id === row.connected_order_id);

	const alertErr = (subtitle: string) => {
		setAlertState('error');
		setAlertSubtitle(subtitle);
		setTimeout(() => {
			setAlertState(null);
			setAlertSubtitle('');
		}, 3000);
	};

	const onClick = async () => {
		setLoading(true);

		let result: { success: boolean } | null = null;

		try {
			if (row.id) {
				updateAutoClosedNotification(dispatch, [
					...state.closed_notifications,
					parseInt(String(row.id), 10),
				]);
			}

			if (row.transaction) {
				if (!row.hex_raw_proposal) {
					alertErr('Invalid transaction data received');
					return;
				}
				const confirmSwapResult = await confirmIonicSwap(row.hex_raw_proposal);
				if (confirmSwapResult.data?.error?.code === -7) {
					alertErr('Insufficient funds');
					return;
				}
				if (!confirmSwapResult.data?.result) {
					alertErr('Companion responded with an error');
					return;
				}
				result = await confirmTransaction(row.id);
			} else {
				const firstCurrencyId = pairData?.first_currency.asset_id;
				const secondCurrencyId = pairData?.second_currency.asset_id;
				if (!(firstCurrencyId && secondCurrencyId)) {
					alertErr('Invalid transaction data received');
					return;
				}
				if (!_connectedOrder) return;

				const leftDecimal = new Decimal(row.left);
				const priceDecimal = new Decimal(row.price);

				const params = {
					destinationAssetID: row.type === 'buy' ? secondCurrencyId : firstCurrencyId,
					destinationAssetAmount: notationToString(
						row.type === 'buy'
							? leftDecimal.mul(priceDecimal).toString()
							: leftDecimal.toString(),
					),
					currentAssetID: row.type === 'buy' ? firstCurrencyId : secondCurrencyId,
					currentAssetAmount: notationToString(
						row.type === 'buy'
							? leftDecimal.toString()
							: leftDecimal.mul(priceDecimal).toString(),
					),
					destinationAddress: row.user.address,
				};

				const createSwapResult = await ionicSwap(params);
				const hex = createSwapResult?.data?.result?.hex_raw_proposal;

				if (createSwapResult?.data?.error?.code === -7) {
					alertErr('Insufficient funds');
					return;
				}
				if (!hex) {
					alertErr('Companion responded with an error');
					return;
				}

				result = await applyOrder({ ...row, hex_raw_proposal: hex });
			}
		} finally {
			setLoading(false);
		}

		if (!result) return;
		if (!result.success) {
			alertErr('Server responded with an error');
			return;
		}
		await onAfter();
	};

	return (
		<ActionBtn variant="success" disabled={loading} onClick={() => onClick()}>
			{type === 'request' ? 'Request' : 'Accept'}
		</ActionBtn>
	);
}
