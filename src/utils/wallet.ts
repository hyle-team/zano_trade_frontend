import ZanoWindow from '@/interfaces/common/ZanoWindow';
import IonicSwap from '@/interfaces/wallet/IonicSwap';

async function requestCompanionPermissions(permissions: { type: string }[]): Promise<void> {
	const result = await (window as unknown as ZanoWindow).zano.request('REQUEST_ACCESS', {
		permissions,
	});

	if (result?.error?.includes('Unknown method')) {
		// Old extension — no permissions system, continue with legacy flow
		console.warn('Companion does not support permissions system, continuing with legacy flow');
		return;
	}

	if (result?.error) {
		throw new Error(result.error);
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
