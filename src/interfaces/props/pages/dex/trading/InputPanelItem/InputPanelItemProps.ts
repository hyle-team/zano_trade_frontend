import SelectValue from '@/interfaces/states/pages/dex/trading/InputPanelItem/SelectValue';
import { Dispatch, SetStateAction } from 'react';

interface InputPanelItemProps {
	currencyNames: {
		firstCurrencyName: string;
		secondCurrencyName: string;
	};
	priceState: string;
	amountState: string;
	totalState: string;
	buySellState: SelectValue;
	setBuySellState: Dispatch<SetStateAction<SelectValue>>;
	setPriceFunction: (_value: string) => void;
	setAmountFunction: (_value: string) => void;
	setRangeInputValue: Dispatch<SetStateAction<string>>;
	rangeInputValue: string;
	balance: number | undefined;
	amountValid: boolean;
	priceValid: boolean;
	totalValid: boolean;
	totalUsd: string | undefined;
	scrollToOrderList: () => void;
	onAfter: () => Promise<void>;
}

export default InputPanelItemProps;
