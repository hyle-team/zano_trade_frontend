import { useEffect, useState } from 'react';
import { SwapMode } from '@/utils/swap';

export const DEX_MODE_COOKIE = 'dex_mode';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseDexMode(value: unknown): SwapMode | null {
	return value === 'advanced' || value === 'standard' ? value : null;
}

export function getStoredDexMode(): SwapMode {
	if (typeof document === 'undefined') return 'standard';

	const entry = document.cookie
		.split('; ')
		.find((item) => item.startsWith(`${DEX_MODE_COOKIE}=`));

	return parseDexMode(entry?.split('=')[1]) ?? 'standard';
}

export function setStoredDexMode(mode: SwapMode) {
	document.cookie = `${DEX_MODE_COOKIE}=${mode}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function getDexOrderHref(
	mode: SwapMode,
	pairId: string | number,
	orderId?: string | number | null,
) {
	if (mode === 'advanced') return `/dex/trading/${pairId}#my_orders`;

	return orderId ? `/dex?pair=${pairId}&order=${orderId}` : `/dex?pair=${pairId}`;
}

export function useStoredDexMode() {
	const [mode, setMode] = useState<SwapMode>('standard');

	useEffect(() => {
		setMode(getStoredDexMode());
	}, []);

	return mode;
}
