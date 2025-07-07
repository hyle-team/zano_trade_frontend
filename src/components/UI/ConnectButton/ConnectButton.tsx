import { useContext, useState } from 'react';
import { Store } from '@/store/store-reducer';
import { updateWalletState } from '@/store/actions';
import Alert from '@/components/UI/Alert/Alert';
import useUpdateUser from '@/hook/useUpdateUser';
import AlertType from '@/interfaces/common/AlertType';
import ConnectButtonProps from '@/interfaces/props/components/UI/ConnectButton/ConnectButtonProps';
import ZanoWindow from '@/interfaces/common/ZanoWindow';
import { getSavedWalletCredentials, setWalletCredentials } from '@/utils/utils';
import { uuid } from 'uuidv4';
import Button from '../Button/Button';

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
			const walletData = (
				await (window as unknown as ZanoWindow).zano.request('GET_WALLET_DATA')
			).data;

			if (!walletData?.address) {
				throw new Error('Companion is offline');
			}

			if (!walletData?.alias) {
				throw new Error('Alias not found');
			}

			let nonce = '';
			let signature = '';
			let publicKey = '';

			const existingWallet = getSavedWalletCredentials();

			if (existingWallet) {
				nonce = existingWallet.nonce;
				signature = existingWallet.signature;
				publicKey = existingWallet.publicKey;
			} else {
				const generatedNonce = uuid();
				const signResult = await (window as unknown as ZanoWindow).zano.request(
					'REQUEST_MESSAGE_SIGN',
					{ message: generatedNonce },
					null,
				);

				if (!signResult?.data?.result) {
					throw new Error('Sign denied');
				}

				nonce = generatedNonce;
				signature = signResult.data.result.sig;
				publicKey = signResult.data.result.pkey;
			}

			const result = await fetch('/api/auth', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					data: {
						alias: walletData.alias,
						address: walletData.address,
						signature,
						publicKey,
						message: nonce,
					},
				}),
			}).then((res) => res.json());

			if (!result?.success) {
				throw new Error('Server auth error');
			}

			if (!existingWallet) {
				setWalletCredentials({
					publicKey,
					signature,
					nonce,
				});
			}

			updateWalletState(dispatch, { ...walletData, connected: true });

			await fetchUser();

			await Notification.requestPermission();

			setAlertState('success');
			setTimeout(() => setAlertState(null), 3000);
		} catch (error) {
			setAlertState('error');
			setAlertErrMessage((error as { message: string }).message);
			setTimeout(() => setAlertState(null), 3000);
			setWalletCredentials(undefined);
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
