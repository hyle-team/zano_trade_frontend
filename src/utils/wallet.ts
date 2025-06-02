import ZanoWindow from '@/interfaces/common/ZanoWindow';
import IonicSwap from '@/interfaces/wallet/IonicSwap';

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

export { ionicSwap, confirmIonicSwap };
