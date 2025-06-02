import CurrencyRow from '../common/CurrencyRow';

interface FiltersState {
	buyState: boolean;
	price: string;
	inputCurrency: CurrencyRow | null;
	targetCurrency: CurrencyRow | null;
}

export default FiltersState;
