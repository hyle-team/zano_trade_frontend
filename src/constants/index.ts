import PeriodState from '@/interfaces/states/pages/dex/trading/InputPanelItem/PeriodState';
import SelectValue from '@/interfaces/states/pages/dex/trading/InputPanelItem/SelectValue';

export const periods: PeriodState[] = [
	{
		name: '1H',
		code: '1h',
	},
	{
		name: '1D',
		code: '1d',
	},
	{
		name: '1W',
		code: '1w',
	},
	{
		name: '1M',
		code: '1m',
	},
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
