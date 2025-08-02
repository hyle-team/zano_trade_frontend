import AlertType from '@/interfaces/common/AlertType';
import SelectValue from '@/interfaces/states/pages/dex/trading/InputPanelItem/SelectValue';
import { Dispatch, SetStateAction } from 'react';

interface InputPanelItemProps {
	priceState: string;
	amountState: string;
	totalState: string;
	buySellValues: SelectValue[];
	buySellState: SelectValue;
	// setBuySellState: Dispatch<SetStateAction<SelectValue>>;
	setPriceFunction: (_value: string) => void;
	setAmountFunction: (_value: string) => void;
	setAlertState: Dispatch<SetStateAction<AlertType>>;
	setAlertSubtitle: Dispatch<SetStateAction<string>>;
	setRangeInputValue: Dispatch<SetStateAction<string>>;
	rangeInputValue: string;
	firstCurrencyName: string;
	secondCurrencyName: string;
	balance: number | undefined;
	amountValid: boolean;
	priceValid: boolean;
	totalValid: boolean;
	totalUsd: string | undefined;
	scrollToOrderList: () => void;
}

export default InputPanelItemProps;
