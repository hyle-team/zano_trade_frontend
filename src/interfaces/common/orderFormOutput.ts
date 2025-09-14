import { Dispatch, SetStateAction } from 'react';

interface OrderFormOutput {
	price: string;
	amount: string;
	total: string;
	priceValid: boolean;
	amountValid: boolean;
	totalValid: boolean;
	totalUsd: string | undefined;
	rangeInputValue: string;
	setRangeInputValue: Dispatch<SetStateAction<string>>;
	onPriceChange: (_inputValue: string) => void;
	onAmountChange: (_inputValue: string) => void;
	resetForm: () => void;
	setTotal: Dispatch<SetStateAction<string>>;
	setPrice: Dispatch<SetStateAction<string>>;
	setAmount: Dispatch<SetStateAction<string>>;
	setPriceValid: Dispatch<SetStateAction<boolean>>;
	setAmountValid: Dispatch<SetStateAction<boolean>>;
	setTotalValid: Dispatch<SetStateAction<boolean>>;
}

export default OrderFormOutput;
