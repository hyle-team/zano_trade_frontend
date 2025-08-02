import WalletCredentials from '@/interfaces/common/WalletCredentials';
import Decimal from 'decimal.js';

export const intToStrFixedLen = (int: number, fixed = 2) => {
	let str = int.toString();
	while (str.length < fixed) {
		str = `0${str}`;
	}

	return str;
};

export const shortenAddress = (address: string, startAmount = 6, endAmount = 4) =>
	`${(address || '').slice(0, startAmount)}...${(address || '').slice(-endAmount)}`;

export const cutAddress = (address = '', maxAmount = 6) => {
	if (maxAmount >= address.length) {
		return address || '';
	}

	return `${(address || '').slice(0, maxAmount)}...`;
};

export const toStandardDateString = (date: Date) =>
	`${date.getFullYear()}-${intToStrFixedLen(date.getMonth() + 1, 2)}-${intToStrFixedLen(date.getDate(), 2)}`;

export const separateArray = <T>(arr: T[], func: (_item: T) => boolean) => {
	const trueArr: T[] = [];
	const falseArr: T[] = [];
	arr.forEach((item) => {
		if (func(item)) {
			trueArr.push(item);
		} else {
			falseArr.push(item);
		}
	});
	return [...trueArr, ...falseArr];
};

export const formatDollarValue = (value: string) => {
	const numValue = parseFloat(value);

	const withFullDecimals = numValue >= 1 ? numValue.toFixed(2) : numValue.toFixed(6);

	return parseFloat(withFullDecimals).toString();
};

export const canvasResize = (inputCanvas: HTMLCanvasElement) => {
	const canvas = inputCanvas;
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

	const screenRatio = (() => {
		const devicePixelRatio = window.devicePixelRatio || 1;

		const backingStorePixel =
			(ctx as unknown as { webkitBackingStorePixelRatio?: number })
				?.webkitBackingStorePixelRatio ||
			(ctx as unknown as { mozBackingStorePixelRatio?: number })?.mozBackingStorePixelRatio ||
			(ctx as unknown as { msBackingStorePixelRatio?: number })?.msBackingStorePixelRatio ||
			(ctx as unknown as { oBackingStorePixelRatio?: number })?.oBackingStorePixelRatio ||
			(ctx as unknown as { backingStorePixelRatio?: number })?.backingStorePixelRatio ||
			1;

		return devicePixelRatio / backingStorePixel;
	})();

	const selectedWidth = canvas.getBoundingClientRect().width;
	const selectedHeight = canvas.getBoundingClientRect().height;

	canvas.width = selectedWidth * screenRatio;
	canvas.height = selectedHeight * screenRatio;

	ctx?.setTransform?.(screenRatio, 0, 0, screenRatio, 0, 0);
};

export const roundTo = (x: number | string, digits = 7) => {
	if (x === undefined || x === null) {
		return NaN;
	}
	const decimalValue = new Decimal(x);

	const fixedValue = decimalValue.toFixed(digits);

	// Remove trailing zeros
	return fixedValue.replace(/(\.\d*?[1-9])0+$/g, '$1').replace(/\.0+$/, '');
};

export const notationToString = (notation: number | string) => {
	const decimalValue = new Decimal(notation || '0');

	const fixedValue = decimalValue.toFixed();

	// Remove trailing zeros
	return fixedValue;
};

export const localeTimeLeft = (now: number | null, timestamp: number) => {
	if (!now) return '00:00:00';
	const timeLeft = timestamp - now;

	if (timeLeft < 0) {
		return '00:00:00';
	}

	const hours = Math.floor(timeLeft / 3600000);
	const minutes = Math.floor((timeLeft - hours * 3600000) / 60000);
	const seconds = Math.floor((timeLeft - hours * 3600000 - minutes * 60000) / 1000);

	return `${intToStrFixedLen(hours)}:${intToStrFixedLen(minutes)}:${intToStrFixedLen(seconds)}`;
};

export function getSavedWalletCredentials() {
	const savedWallet = localStorage.getItem('wallet');
	if (!savedWallet) return undefined;
	try {
		return JSON.parse(savedWallet) as WalletCredentials;
	} catch {
		return undefined;
	}
}

export function setWalletCredentials(credentials: WalletCredentials | undefined) {
	if (credentials) {
		localStorage.setItem('wallet', JSON.stringify(credentials));
	} else {
		localStorage.removeItem('wallet');
	}
}

export function isPositiveFloatStr(input: string) {
	const regExp = /^\d+(\.\d*)?$/;
	return regExp.test(input);
}

export function formatTime(ts: string | number) {
	let num = Number(ts);

	if (num < 1e12) num *= 1000;
	const date = new Date(num);

	if (Number.isNaN(date.getTime())) return '-';

	return date.toLocaleTimeString('ru-RU', { hour12: false });
}

export function classes(...items: (string | boolean | undefined)[]): string {
	// boolean for constructions like [predicate] && [className]
	return items.filter((className) => className).join(' ');
}

export const ZANO_ASSET_ID = 'd6329b5b1f7c0805b5c345f4957554002a2f557845f64d7645dae0e051a6498a';

const knownCurrencies = ['zano', 'xmr', 'btc', 'firo', 'usd', 'eur', 'cad', 'jpy'];

const tradingKnownCurrencies = ['zano', 'weth', 'wbtc'];

export { tradingKnownCurrencies, knownCurrencies };
