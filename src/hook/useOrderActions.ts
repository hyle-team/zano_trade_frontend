import Decimal from 'decimal.js';
import { useContext } from 'react';
import {
	ZanoWebError,
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
		updateAutoClosedNotification(dispatch, [
			...state.closed_notifications,
			parseInt(String(id), 10),
		]);
	};

	const handleWalletError = (error: unknown) => {
		if (error instanceof ZanoWebError && error.code === 'ZANO_WALLET_NOT_AVAILABLE') {
			alertErr('Companion is offline');
			return;
		}

		throw error;
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
			alertErr(
				confirmSwapResult.error === 'WALLET_RPC_ERROR_-7'
					? 'Insufficient funds'
					: 'Companion responded with an error',
			);
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

		const leftDecimal = new Decimal(tip.left);
		const priceDecimal = new Decimal(tip.price);
		const isOpponentBuy = tip.type === 'buy';

		const params: InitializeIonicSwapParams = {
			destinationAssetID: isOpponentBuy ? secondCurrencyId : firstCurrencyId,
			destinationAssetAmount: notationToString(
				isOpponentBuy ? leftDecimal.mul(priceDecimal).toString() : leftDecimal.toString(),
			),
			currentAssetID: isOpponentBuy ? firstCurrencyId : secondCurrencyId,
			currentAssetAmount: notationToString(
				isOpponentBuy ? leftDecimal.toString() : leftDecimal.mul(priceDecimal).toString(),
			),
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
			alertErr(
				createSwapResult.error === 'WALLET_RPC_ERROR_-7'
					? 'Insufficient funds'
					: 'Companion responded with an error',
			);
			return false;
		}

		const result = await applyOrder(
			{ ...tip, hex_raw_proposal: createSwapResult.data },
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
