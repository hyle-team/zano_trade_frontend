import PeriodState from '@/interfaces/states/pages/dex/trading/InputPanelItem/PeriodState';
import SelectValue from '@/interfaces/states/pages/dex/trading/InputPanelItem/SelectValue';

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const periods: PeriodState[] = [
	// { name: '1s', code: '1sec' },
	{ name: '1m', code: '1min' },
	{ name: '5m', code: '5min' },
	{ name: '15m', code: '15min' },
	{ name: '30m', code: '30min' },
	{ name: '1h', code: '1h' },
	{ name: '4h', code: '4h' },
	{ name: '1d', code: '1d' },
	{ name: '1w', code: '1w' },
	{ name: '1M', code: '1m' },
];

export const buySellValues: SelectValue[] = [
	{
		name: 'All',
		code: 'all',
	},
	{
		name: 'Buy',
		code: 'buy',
	},
	{
		name: 'Sell',
		code: 'sell',
	},
];
