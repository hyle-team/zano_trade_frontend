import Decimal from 'decimal.js';
import { useContext } from 'react';
import {
	AcceptIonicSwapResponse,
	GetIonicSwapProposalInfoResponseInfo,
	InitializeIonicSwapParams,
	InitializeIonicSwapResponse,
	ZanoWebError,
} from 'zano_web3/web';

import { Store } from '@/store/store-reducer';
import { useAlert } from '@/hook/useAlert';
import {
	applyOrder,
	cancelOrder as cancelOrderRequest,
	cancelTransaction,
	cancelTransaction as cancelTransactionRequest,
	confirmTransaction,
} from '@/utils/methods';
import { updateAutoClosedNotification } from '@/store/actions';
import { notationToString } from '@/utils/utils';
import { zanoWallet } from '@/utils/zanoWallet';
import { getWalletErrorMessage } from '@/utils/walletErrors';
import ApplyTip from '@/interfaces/common/ApplyTip';
import PairData from '@/interfaces/common/PairData';

type ActionResult = boolean;

export function useOrderActions() {
	const { state, dispatch } = useContext(Store);
	const { setAlertState, setAlertSubtitle } = useAlert();

	const alertErr = (subtitle: string) => {
		setAlertState('error');
		setAlertSubtitle(subtitle);
		setTimeout(() => {
			setAlertState(null);
			setAlertSubtitle('');
		}, 3000);
	};

	const closeNotification = (id: string) => {
		updateAutoClosedNotification(dispatch, [...state.closed_notifications, String(id)]);
	};

	const handleWalletError = (error: unknown) => {
		const message = getWalletErrorMessage(error);
		if (!message) console.error(error);
		alertErr(message ?? 'Zano Companion responded with an error');
	};

	const handleCancelTransaction = async ({ txId }: { txId: string }): Promise<boolean> => {
		const cancelResult = await cancelTransaction(txId, { token: state.token });

		if (!cancelResult.success) {
			if (cancelResult.data === 'Unauthorized (JWT)') {
				alertErr('Auth session expired. Please log out and log back in.');
				return false;
			}

			alertErr('Server error occurred. Please try again later.');
			return false;
		}

		alertErr('The on-chain swap was malformed. Order canceled.');

		return true;
	};

	const handleValidateProposalAmounts = async ({
		proposal,
		tip,
		pairData,
	}: {
		proposal: GetIonicSwapProposalInfoResponseInfo['proposal'];
		tip: ApplyTip;
		pairData: PairData | null;
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
			amountAtomic: toAtomic(new Decimal(tip.left), firstCurrencyAssetInfo.decimal_point),
		};
		const expectedSecond = {
			assetId: secondCurrencyAssetInfo.asset_id,
			amountAtomic: toAtomic(
				new Decimal(tip.left).mul(new Decimal(tip.price)),
				secondCurrencyAssetInfo.decimal_point,
			),
		};

		const isInitiatorBuying = tip.type === 'buy';
		const expectedToInitiator = isInitiatorBuying ? expectedFirst : expectedSecond;
		const expectedToFinalizer = isInitiatorBuying ? expectedSecond : expectedFirst;

		const { to_initiator: toInitiator, to_finalizer: toFinalizer } = proposal;

		if (toInitiator.length !== 1 || toFinalizer.length !== 1) {
			return handleCancelTransaction({ txId: tip.id });
		}

		const isToFinalizerValid =
			toFinalizer[0].asset_id === expectedToFinalizer.assetId &&
			new Decimal(toFinalizer[0].amount).equals(expectedToFinalizer.amountAtomic);

		const isToInitiatorValid =
			toInitiator[0].asset_id === expectedToInitiator.assetId &&
			new Decimal(toInitiator[0].amount).equals(expectedToInitiator.amountAtomic);

		if (!isToFinalizerValid || !isToInitiatorValid) {
			return handleCancelTransaction({ txId: tip.id });
		}

		return true;
	};

	async function acceptProposal(tip: ApplyTip, pairData: PairData | null): Promise<ActionResult> {
		if (!tip.hex_raw_proposal) {
			alertErr('Invalid transaction data received');
			return false;
		}

		let getProposalInfoResult;

		try {
			getProposalInfoResult = await zanoWallet.getIonicSwapProposalInfo(tip.hex_raw_proposal);
		} catch (error) {
			if (error instanceof ZanoWebError) {
				if (error.code === 'ZANO_WALLET_NOT_AVAILABLE') {
					alertErr('Companion is offline');
					return false;
				}
			}

			throw error;
		}

		if (!getProposalInfoResult.success) {
			if (getProposalInfoResult.error === 'WALLET_RPC_ERROR_-6') {
				return handleCancelTransaction({ txId: tip.id });
			}

			if (getProposalInfoResult.error === 'WALLET_RPC_ERROR_-4') {
				alertErr(
					'Proposal valid but not found for active wallet. Double-check current wallet.',
				);
				return false;
			}

			alertErr('Companion responded with an error');
			return false;
		}

		const isProposalValid = await handleValidateProposalAmounts({
			proposal: getProposalInfoResult.data.proposal,
			tip,
			pairData,
		});

		if (!isProposalValid) {
			return false;
		}

		let confirmSwapResult: AcceptIonicSwapResponse;

		try {
			confirmSwapResult = await zanoWallet.acceptIonicSwap(tip.hex_raw_proposal);
		} catch (error) {
			if (error instanceof ZanoWebError) {
				if (error.code === 'ZANO_WALLET_NOT_AVAILABLE') {
					alertErr('Companion is offline');
					return false;
				}
			}

			throw error;
		}

		if (!confirmSwapResult.success) {
			if (confirmSwapResult.error === 'WALLET_RPC_ERROR_-7') {
				alertErr('Insufficient funds');
				return false;
			}

			alertErr('Companion responded with an error');
			return false;
		}

		const result = await confirmTransaction(tip.id, { token: state.token });

		if (!result.success) {
			alertErr('Server responded with an error');
			return false;
		}

		return true;
	}

	async function requestMatch(tip: ApplyTip, pairData: PairData | null): Promise<ActionResult> {
		if (tip.id) closeNotification(tip.id);

		const firstCurrencyId = pairData?.first_currency.asset_id;
		const secondCurrencyId = pairData?.second_currency.asset_id;

		if (!(firstCurrencyId && secondCurrencyId)) {
			alertErr('Invalid transaction data received');
			return false;
		}

		const toBeTraded = tip.to_be_traded;

		if (!toBeTraded) {
			alertErr('Invalid transaction data received');
			return false;
		}

		const baseAmount = notationToString(new Decimal(toBeTraded.baseAmount).toString());
		const quoteAmount = notationToString(new Decimal(toBeTraded.quoteAmount).toString());
		const isOpponentBuy = tip.type === 'buy';

		const params: InitializeIonicSwapParams = {
			destinationAssetID: isOpponentBuy ? secondCurrencyId : firstCurrencyId,
			destinationAssetAmount: isOpponentBuy ? quoteAmount : baseAmount,
			currentAssetID: isOpponentBuy ? firstCurrencyId : secondCurrencyId,
			currentAssetAmount: isOpponentBuy ? baseAmount : quoteAmount,
			destinationAddress: tip.user.address,
		};

		let createSwapResult: InitializeIonicSwapResponse;

		try {
			createSwapResult = await zanoWallet.initializeIonicSwap(params);
		} catch (error) {
			handleWalletError(error);
			return false;
		}

		if (!createSwapResult.success) {
			handleWalletError(createSwapResult.error);
			return false;
		}

		const result = await applyOrder(
			{
				id: tip.id,
				connected_order_id: tip.connected_order_id,
				hex_raw_proposal: createSwapResult.data,
				base_amount_in_atomics: toBeTraded.baseAmountInAtomics,
				quote_amount_in_atomics: toBeTraded.quoteAmountInAtomics,
			},
			{ token: state.token },
		);

		if (!result.success) {
			alertErr(
				typeof result.data === 'string' ? result.data : 'Server responded with an error',
			);
			return false;
		}

		return true;
	}

	async function cancelOrder(orderId: string): Promise<ActionResult> {
		const result = await cancelOrderRequest(orderId, { token: state.token });

		if (!result.success) {
			alertErr('Error while cancelling order');
			return false;
		}

		return true;
	}

	async function cancelRequest(transactionId: string): Promise<ActionResult> {
		const result = await cancelTransactionRequest(transactionId, { token: state.token });

		if (!result.success) {
			alertErr('Error while cancelling request');
			return false;
		}

		return true;
	}

	return { acceptProposal, requestMatch, cancelOrder, cancelRequest, alertErr };
}
