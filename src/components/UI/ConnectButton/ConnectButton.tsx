import { useContext, useState } from 'react';
import { Store } from '@/store/store-reducer';
import { updateWalletState } from '@/store/actions';
import Alert from '@/components/UI/Alert/Alert';
import useUpdateUser from '@/hook/useUpdateUser';
import AlertType from '@/interfaces/common/AlertType';
import ConnectButtonProps from '@/interfaces/props/components/UI/ConnectButton/ConnectButtonProps';
import ZanoWindow from '@/interfaces/common/ZanoWindow';
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

			const walletAddress = walletData?.address;
			const walletAlias = walletData?.alias;

			if (!walletAddress) {
				throw new Error('Companion is offline');
			}

			if (!walletAlias) {
				throw new Error('Alias not found');
			}

			if (typeof walletAddress !== 'string' || typeof walletAlias !== 'string') {
				throw new Error('Invalid wallet data');
			}

			const authRequestRes = await fetch('/api/auth/request-auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					address: walletAddress,
					alias: walletAlias,
				}),
			}).then((res) => res.json());

			const authMessage = authRequestRes?.data;

			if (!authRequestRes.success || typeof authMessage !== 'string') {
				throw new Error('Unknown error during auth request');
			}

			const signResult = await (window as unknown as ZanoWindow).zano.request(
				'REQUEST_MESSAGE_SIGN',
				{ message: authMessage },
				null,
			);

			if (!signResult?.data?.result) {
				throw new Error('Sign denied');
			}

			const signature = signResult.data.result.sig;
			const publicKey = signResult.data.result.pkey;

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
						publicKey,
						message: authMessage,
					},
				}),
			}).then((res) => res.json());

			if (!result?.success) {
				throw new Error('Server auth error');
			}

			sessionStorage.setItem('token', result?.data);

			updateWalletState(dispatch, { ...walletData, connected: true });

			await fetchUser();

			await Notification.requestPermission();

			setAlertState('success');
			setTimeout(() => setAlertState(null), 3000);
		} catch (error) {
			setAlertState('error');
			setAlertErrMessage((error as { message: string }).message);
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
