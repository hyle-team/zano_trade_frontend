import { Dispatch, SetStateAction } from 'react';
import Decimal from 'decimal.js';
import { isPositiveFloatStr } from '@/utils/utils';
import { validateTokensInput } from 'shared/utils';

interface HandleInputChangeParams {
	inputValue: string;
	priceOrAmount: 'price' | 'amount';
	otherValue: string;
	thisDP: number;
	totalDP: number;
	setThisState: Dispatch<SetStateAction<string>>;
	setTotalState: Dispatch<SetStateAction<string>>;
	setThisValid: Dispatch<SetStateAction<boolean>>;
	setTotalValid: Dispatch<SetStateAction<boolean>>;
	balance?: string | undefined;
	setRangeInputValue?: Dispatch<SetStateAction<string>>;
}

export function handleInputChange({
	inputValue,
	priceOrAmount,
	otherValue,
	thisDP,
	totalDP,
	setThisState,
	setTotalState,
	setThisValid,
	setTotalValid,
	balance,
	setRangeInputValue,
}: HandleInputChangeParams) {
	if (inputValue !== '' && !isPositiveFloatStr(inputValue)) return;

	const digitsOnly = inputValue.replace('.', '').replace(/^0+/, '');
	if (digitsOnly.length > 18) return;

	let thisDecimal: Decimal;
	let otherDecimal: Decimal;

	try {
		thisDecimal = new Decimal(inputValue || '0');
		otherDecimal = new Decimal(otherValue || '0');
	} catch (err) {
		console.log(err);
		setThisValid(false);
		setTotalValid(false);
		return;
	}

	setThisState(inputValue);

	if (!inputValue) {
		setTotalState('');
		setTotalValid(false);
		setThisValid(false);
		return;
	}

	const isValid = validateTokensInput(inputValue, thisDP);
	if (!isValid.valid) {
		setTotalState('');
		setTotalValid(false);
		setThisValid(false);
		return;
	}

	setThisValid(true);

	if (!thisDecimal.isNaN() && !otherDecimal.isNaN() && otherValue !== '') {
		const total =
			priceOrAmount === 'price'
				? thisDecimal.mul(otherDecimal)
				: otherDecimal.mul(thisDecimal);

		setTotalState(total.toString());

		const totalValid = validateTokensInput(total.toFixed(totalDP), totalDP);
		setTotalValid(totalValid.valid);

		if (priceOrAmount === 'amount' && balance && setRangeInputValue) {
			const percent = thisDecimal.div(balance).mul(100);
			setRangeInputValue(percent.toFixed());
		}
	} else {
		setTotalState('');
		setTotalValid(false);
	}
}
