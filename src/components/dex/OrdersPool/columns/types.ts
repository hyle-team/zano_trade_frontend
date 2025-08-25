import MatrixAddress from '@/interfaces/common/MatrixAddress';

export interface BuildOrderPoolColumnsArgs {
	firstCurrencyName: string;
	secondCurrencyName: string;
	matrixAddresses: MatrixAddress[];
}

export interface BuildTradesColumnsArgs {
	firstCurrencyName: string;
	secondCurrencyName: string;
}
