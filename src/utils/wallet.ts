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

export { requestCompanionPermissions };
