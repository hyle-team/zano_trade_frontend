import DateState from '@/interfaces/common/DateState';

type BuySell = 'Buy & Sell' | 'Buy' | 'Sell';

interface FiltersState {
	buySell: BuySell;
	date: DateState;
}

export default FiltersState;

export type { BuySell };
