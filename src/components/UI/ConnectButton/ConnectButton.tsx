import { useContext, useState } from 'react';
import { Store } from '@/store/store-reducer';
import { updateToken, updateWalletState } from '@/store/actions';
import Alert from '@/components/UI/Alert/Alert';
import useUpdateUser from '@/hook/useUpdateUser';
import AlertType from '@/interfaces/common/AlertType';
import ConnectButtonProps from '@/interfaces/props/components/UI/ConnectButton/ConnectButtonProps';
import { requestCompanionPermissions } from '@/utils/wallet';
import { zanoWallet } from '@/utils/zanoWallet';
import { ZanoWebError, GetWalletDataResponse, RequestMessageSignResponse } from 'zano_web3/web';
import { WalletState } from '@/interfaces/common/ContextValue';
import Button from '../Button/Button';

enum ConnectErrorMessage {
	NO_EXTENSION = 'Zano Companion extension is not installed',
	COMPANION_OFFLINE = 'Companion is offline',
	ALIAS_NOT_FOUND = 'Alias not found',
	INVALID_WALLET_DATA = 'Invalid wallet data',
	SIGN_DENIED = 'Sign denied',
	SERVER_AUTH_ERROR = 'Server authentication error',
}

function ConnectButton(props: ConnectButtonProps) {
	const [alertState, setAlertState] = useState<AlertType>(null);
	const [alertErrMessage, setAlertErrMessage] = useState<string>();
	const { state, dispatch } = useContext(Store);
	const logged = !!state.wallet?.connected;

	const fetchUser = useUpdateUser();

	async function connect() {
		if (alertState) return;

		try {
			setAlertState('loading');
			await new Promise((resolve) => setTimeout(resolve, 1000));

			try {
				await requestCompanionPermissions([{ type: 'general' }, { type: 'balance' }]);
			} catch (error) {
				if (error instanceof ZanoWebError && error.code === 'ZANO_WALLET_NOT_AVAILABLE') {
					throw new Error(ConnectErrorMessage.NO_EXTENSION);
				}

				throw error;
			}

			let getWalletDataResult: GetWalletDataResponse;

			try {
				getWalletDataResult = await zanoWallet.getWallet();
			} catch (error) {
				if (error instanceof ZanoWebError && error.code === 'ZANO_WALLET_NOT_AVAILABLE') {
					throw new Error(ConnectErrorMessage.NO_EXTENSION);
				}

				throw error;
			}

			if (!getWalletDataResult.success) {
				throw new Error(getWalletDataResult.error);
			}

			const { data: walletData } = getWalletDataResult;

			const walletAddress = walletData.address;
			const walletAlias = walletData.alias;

			if (!walletAddress) {
				throw new Error(ConnectErrorMessage.COMPANION_OFFLINE);
			}

			if (!walletAlias) {
				throw new Error(ConnectErrorMessage.ALIAS_NOT_FOUND);
			}

			if (typeof walletAddress !== 'string' || typeof walletAlias !== 'string') {
				throw new Error(ConnectErrorMessage.INVALID_WALLET_DATA);
			}

			const authRequestRes = await fetch('/api/auth/request-auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					address: walletAddress,
					alias: walletAlias,
					path: window.location.pathname,
				}),
			}).then((res) => res.json());

			const authMessage = authRequestRes?.data;

			if (!authRequestRes.success || typeof authMessage !== 'string') {
				throw new Error(ConnectErrorMessage.SERVER_AUTH_ERROR);
			}

			let signResult: RequestMessageSignResponse;

			try {
				signResult = await zanoWallet.requestMessageSign(authMessage);
			} catch (error) {
				if (error instanceof ZanoWebError && error.code === 'ZANO_WALLET_NOT_AVAILABLE') {
					throw new Error(ConnectErrorMessage.NO_EXTENSION);
				}

				throw error;
			}

			if (!signResult.success) {
				if (signResult.error === 'Sign request denied by user') {
					throw new Error(ConnectErrorMessage.SIGN_DENIED);
				}

				throw new Error(signResult.error);
			}

			const { data: signResultData } = signResult;

			const signature = signResultData.sig;
			const publicKey = signResultData.pkey;

			const result = await fetch('/api/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					data: {
						alias: walletAlias,
						address: walletAddress,
						signature,
						pkey: publicKey,
						message: authMessage,
					},
				}),
			}).then((res) => res.json());

			if (!result?.success) {
				throw new Error(ConnectErrorMessage.SERVER_AUTH_ERROR);
			}

			updateToken(dispatch, result?.data);

			updateWalletState(dispatch, { ...walletData, connected: true } as WalletState);

			await fetchUser();

			await Notification.requestPermission();

			setAlertState('success');
			setTimeout(() => setAlertState(null), 3000);
		} catch (error) {
			const errorMessage =
				'message' in (error as Error) ? (error as Error).message : undefined;

			const isErrorKnown =
				errorMessage !== undefined &&
				Object.values(ConnectErrorMessage).some((msg) => msg === errorMessage);

			const knownError = isErrorKnown
				? errorMessage
				: 'Internal error occurred. Please try again.';

			if (!isErrorKnown) {
				console.error('Error connecting wallet:', error);
			}

			setAlertState('error');
			setAlertErrMessage(knownError);
			setTimeout(() => setAlertState(null), 3000);
		}
	}

	let alertSubtitle: string;

	if (alertState === 'loading') {
		alertSubtitle = 'Loading wallet data...';
	} else if (alertState === 'success') {
		alertSubtitle = 'Wallet connected';
	} else {
		alertSubtitle = alertErrMessage || 'Connection error';
	}

	return (
		<>
			{!logged && (
				<Button
					onClick={connect}
					className={props.className}
					transparent={props.transparent}
				>
					Connect Wallet
				</Button>
			)}
			{alertState && (
				<Alert
					type={alertState}
					subtitle={alertSubtitle}
					close={() => setAlertState(null)}
				/>
			)}
		</>
	);
}

export default ConnectButton;
