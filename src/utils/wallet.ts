import ZanoWindow from '@/interfaces/common/ZanoWindow';
import IonicSwap from '@/interfaces/wallet/IonicSwap';
import { zanoWallet } from './zanoWallet';

async function requestCompanionPermissions(
	permissions: { type: 'general' | 'balance' | 'history' }[],
): Promise<void> {
	const NOT_SUPPORTED_LOG =
		'Companion does not support permissions system, continuing with legacy flow';

	const requestPermissionsResult = await zanoWallet.requestPermissions(permissions);

	if (requestPermissionsResult.success) {
		return;
	}

	const { error } = requestPermissionsResult;

	if (error.includes('Unknown method')) {
		console.warn(NOT_SUPPORTED_LOG);
		return;
	}

	throw new Error(error);
}

async function ionicSwap(params: IonicSwap) {
	// TODO: Replace with `zanoWallet` object
	return (window as unknown as ZanoWindow).zano.request('IONIC_SWAP', params, null);
}

async function confirmIonicSwap(hex_raw_proposal: string) {
	// TODO: Replace with `zanoWallet` object
	return (window as unknown as ZanoWindow).zano.request(
		'IONIC_SWAP_ACCEPT',
		{ hex_raw_proposal },
		null,
	);
}

export { requestCompanionPermissions, ionicSwap, confirmIonicSwap };
