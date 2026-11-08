import Decimal from 'decimal.js';
import { useContext } from 'react';
import {
	AcceptIonicSwapResponse,
	InitializeIonicSwapParams,
	InitializeIonicSwapResponse,
} from 'zano_web3/web';

import { Store } from '@/store/store-reducer';
import { useAlert } from '@/hook/useAlert';
import {
	applyOrder,
	cancelOrder as cancelOrderRequest,
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

	async function acceptProposal(tip: ApplyTip): Promise<ActionResult> {
		if (tip.id) closeNotification(tip.id);

		if (!tip.hex_raw_proposal) {
			alertErr('Invalid transaction data received');
			return false;
		}

		let confirmSwapResult: AcceptIonicSwapResponse;

		try {
			confirmSwapResult = await zanoWallet.acceptIonicSwap(tip.hex_raw_proposal);
		} catch (error) {
			handleWalletError(error);
			return false;
		}

		if (!confirmSwapResult.success) {
			handleWalletError(confirmSwapResult.error);
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
