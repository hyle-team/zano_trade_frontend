import ZanoWindow from '@/interfaces/common/ZanoWindow';
import IonicSwap from '@/interfaces/wallet/IonicSwap';

async function requestCompanionPermissions(permissions: { type: string }[]): Promise<void> {
	const NOT_SUPPORTED_LOG =
		'Companion does not support permissions system, continuing with legacy flow';

	try {
		const result = await (window as unknown as ZanoWindow).zano.request('REQUEST_ACCESS', {
			permissions,
		});

		const error = String(result?.error || '');

		if (error.includes('Unknown method')) {
			console.warn(NOT_SUPPORTED_LOG);
			return;
		}

		if (error) {
			throw new Error(error);
		}
	} catch (error) {
		if (error instanceof Error && error.message.includes('not a function')) {
			console.warn(NOT_SUPPORTED_LOG);
			return;
		}

		throw error;
	}
}

async function ionicSwap(params: IonicSwap) {
	return (window as unknown as ZanoWindow).zano.request('IONIC_SWAP', params, null);
}

async function confirmIonicSwap(hex_raw_proposal: string) {
	return (window as unknown as ZanoWindow).zano.request(
		'IONIC_SWAP_ACCEPT',
		{ hex_raw_proposal },
		null,
	);
}

export { requestCompanionPermissions, ionicSwap, confirmIonicSwap };
