import { ZanoWebError } from 'zano_web3/web';

export const WALLET_ERROR_MESSAGES = {
	NOT_AVAILABLE: 'Zano Companion is not installed or not available',
	LOCKED: 'Zano Companion is locked or offline. Unlock it and try again.',
	REJECTED: 'The request was rejected in Zano Companion',
	TIMEOUT: 'Zano Companion did not respond in time. Unlock it and try again.',
	NO_PERMISSIONS: 'This wallet is not allowed to sign this request',
	INSUFFICIENT_FUNDS: 'Insufficient funds',
	BUSY: 'Zano Companion already has a pending request. Finish it and try again.',
} as const;

const REJECTED_PATTERNS = ['denied by user', 'rejected', 'sign denied'];

const LOCKED_PATTERNS = [
	'connect_data_not_set',
	'connect_data_corrupted',
	'wrong_decryption_result',
	'unhandled_error',
	'failed to parse companion response',
	'internal error',
	'failed to get wallet data',
	'unauthorized request',
	'failed to verify active wallet',
	'active wallet changed',
	'wallet mismatch',
	'companion is offline',
	'unknown origin',
	'failed to verify wallet type',
];

function extractErrorText(error: unknown): string {
	if (typeof error === 'string') return error;
	if (error instanceof Error) return error.message;
	if (error && typeof error === 'object' && 'error' in error) {
		return String((error as { error: unknown }).error);
	}
	return '';
}

export function getWalletErrorMessage(error: unknown): string | null {
	if (error instanceof ZanoWebError) {
		if (error.code === 'ZANO_WALLET_NOT_AVAILABLE') return WALLET_ERROR_MESSAGES.NOT_AVAILABLE;
		if (error.code === 'INTERNAL_ERROR') return WALLET_ERROR_MESSAGES.LOCKED;
	}

	const text = extractErrorText(error).toLowerCase();
	if (!text) return null;

	if (text.includes('wallet_rpc_error_-7')) return WALLET_ERROR_MESSAGES.INSUFFICIENT_FUNDS;
	if (REJECTED_PATTERNS.some((pattern) => text.includes(pattern))) {
		return WALLET_ERROR_MESSAGES.REJECTED;
	}
	if (text.includes('timeout')) return WALLET_ERROR_MESSAGES.TIMEOUT;
	if (text.includes('already pending')) return WALLET_ERROR_MESSAGES.BUSY;
	if (text === 'no permissions') return WALLET_ERROR_MESSAGES.NO_PERMISSIONS;
	if (LOCKED_PATTERNS.some((pattern) => text.includes(pattern))) {
		return WALLET_ERROR_MESSAGES.LOCKED;
	}

	return null;
}
