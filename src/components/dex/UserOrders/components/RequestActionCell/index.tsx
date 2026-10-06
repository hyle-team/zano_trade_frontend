import Decimal from 'decimal.js';
import { useState, useContext } from 'react';
import type { GetIonicSwapProposalInfoResponseInfo } from 'zano_web3/web';
import {
	ZanoWebError,
	AcceptIonicSwapResponse,
	InitializeIonicSwapParams,
	InitializeIonicSwapResponse,
} from 'zano_web3/web';

import { Store } from '@/store/store-reducer';
import { useAlert } from '@/hook/useAlert';
import { applyOrder, cancelTransaction, confirmTransaction } from '@/utils/methods';
import { updateAutoClosedNotification } from '@/store/actions';
import { notationToString } from '@/utils/utils';
import ActionBtn from '@/components/UI/ActionBtn';
import { zanoWallet } from '@/utils/zanoWallet';
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

	const handleCancelTransaction = async ({ txId }: { txId: string }) => {
		const cancelResult = await cancelTransaction(txId, { token: state.token });

		if (!cancelResult.success) {
			if (cancelResult.data === 'Unauthorized (JWT)') {
				alertErr('Auth session expired. Please log out and log back in.');
				return;
			}

			alertErr('Server error occurred. Please try again later.');
			return;
		}

		alertErr('The on-chain swap was malformed. Order canceled.');
	};

	const handleValidateProposalAmounts = async ({
		proposal,
	}: {
		proposal: GetIonicSwapProposalInfoResponseInfo['proposal'];
	}): Promise<boolean> => {
		const firstCurrencyAssetInfo = pairData?.first_currency.asset_info;
		const secondCurrencyAssetInfo = pairData?.second_currency.asset_info;

		if (!firstCurrencyAssetInfo || !secondCurrencyAssetInfo) {
			alertErr('Internal error occurred. Please try again later.');
			return false;
		}

		const toAtomic = (amount: Decimal, decimalPoint: number) =>
			amount.mul(new Decimal(10).pow(decimalPoint)).toDecimalPlaces(0, Decimal.ROUND_DOWN);

		const expectedFirst = {
			assetId: firstCurrencyAssetInfo.asset_id,
			amountAtomic: toAtomic(new Decimal(row.left), firstCurrencyAssetInfo.decimal_point),
		};
		const expectedSecond = {
			assetId: secondCurrencyAssetInfo.asset_id,
			amountAtomic: toAtomic(
				new Decimal(row.left).mul(new Decimal(row.price)),
				secondCurrencyAssetInfo.decimal_point,
			),
		};

		const isInitiatorBuying = row.type === 'buy';
		const expectedToInitiator = isInitiatorBuying ? expectedFirst : expectedSecond;
		const expectedToFinalizer = isInitiatorBuying ? expectedSecond : expectedFirst;

		const { to_initiator: toInitiator, to_finalizer: toFinalizer } = proposal;

		if (toInitiator.length !== 1 || toFinalizer.length !== 1) {
			await handleCancelTransaction({ txId: row.id });
			return false;
		}

		const isToFinalizerValid =
			toFinalizer[0].asset_id === expectedToFinalizer.assetId &&
			new Decimal(toFinalizer[0].amount).equals(expectedToFinalizer.amountAtomic);

		const isToInitiatorValid =
			toInitiator[0].asset_id === expectedToInitiator.assetId &&
			new Decimal(toInitiator[0].amount).equals(expectedToInitiator.amountAtomic);

		if (!isToFinalizerValid || !isToInitiatorValid) {
			await handleCancelTransaction({ txId: row.id });
			return false;
		}

		return true;
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

				let getProposalInfoResult;

				try {
					getProposalInfoResult = await zanoWallet.getIonicSwapProposalInfo(
						row.hex_raw_proposal,
					);
				} catch (error) {
					if (error instanceof ZanoWebError) {
						if (error.code === 'ZANO_WALLET_NOT_AVAILABLE') {
							alertErr('Companion is offline');
							return;
						}
					}

					throw error;
				}

				if (!getProposalInfoResult.success) {
					if (getProposalInfoResult.error === 'WALLET_RPC_ERROR_-6') {
						await handleCancelTransaction({ txId: row.id });
						return;
					}

					alertErr('Companion responded with an error');
					return;
				}

				const isProposalValid = await handleValidateProposalAmounts({
					proposal: getProposalInfoResult.data.proposal,
				});

				if (!isProposalValid) {
					return;
				}

				let confirmSwapResult: AcceptIonicSwapResponse;

				try {
					confirmSwapResult = await zanoWallet.acceptIonicSwap(row.hex_raw_proposal);
				} catch (error) {
					if (error instanceof ZanoWebError) {
						if (error.code === 'ZANO_WALLET_NOT_AVAILABLE') {
							alertErr('Companion is offline');
							return;
						}
					}

					throw error;
				}

				if (!confirmSwapResult.success) {
					if (confirmSwapResult.error === 'WALLET_RPC_ERROR_-7') {
						alertErr('Insufficient funds');
						return;
					}

					alertErr('Companion responded with an error');
					return;
				}

				result = await confirmTransaction(row.id, { token: state.token });
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

				const params: InitializeIonicSwapParams = {
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

				let createSwapResult: InitializeIonicSwapResponse;

				try {
					createSwapResult = await zanoWallet.initializeIonicSwap(params);
				} catch (error) {
					if (error instanceof ZanoWebError) {
						if (error.code === 'ZANO_WALLET_NOT_AVAILABLE') {
							alertErr('Companion is offline');
							return;
						}
					}

					throw error;
				}

				if (!createSwapResult.success) {
					if (createSwapResult.error === 'WALLET_RPC_ERROR_-7') {
						alertErr('Insufficient funds');
						return;
					}

					alertErr('Companion responded with an error');
					return;
				}

				const hexRawProposal = createSwapResult.data;

				result = await applyOrder(
					{ ...row, hex_raw_proposal: hexRawProposal },
					{ token: state.token },
				);
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
