import CurrencyRow from './CurrencyRow';

interface PairData {
	id: string;
	first_currency: CurrencyRow;
	second_currency: CurrencyRow;
	rate?: number;
	coefficient?: number;
	high?: number;
	low?: number;
	volume: number;
	featured: boolean;
}

export default PairData;
