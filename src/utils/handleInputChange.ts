import { Dispatch, SetStateAction } from 'react';
import Decimal from 'decimal.js';
import { isPositiveFloatStr } from '@/utils/utils';
import { validateTokensInput } from 'shared/utils';

type SetStr = (_v: string) => void;
interface HandleInputChangeParams {
	inputValue: string;
	priceOrAmount: 'price' | 'amount';
	otherValue: string;
	thisDP: number;
	totalDP: number;
	setThisState: SetStr;
	setTotalState: SetStr;
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
		const rawTotal =
			priceOrAmount === 'price'
				? thisDecimal.mul(otherDecimal)
				: otherDecimal.mul(thisDecimal);

		const totalClamped = rawTotal.toDecimalPlaces(totalDP, Decimal.ROUND_DOWN);

		setTotalState(totalClamped.toString());

		const fmtOk = validateTokensInput(totalClamped.toFixed(totalDP), totalDP).valid;
		const gtZero = totalClamped.gt(0);
		setTotalValid(fmtOk && gtZero);

		if (priceOrAmount === 'amount' && balance && setRangeInputValue) {
			const bal = new Decimal(balance || '0');
			const percent = bal.gt(0) ? thisDecimal.div(bal).mul(100) : new Decimal(0);
			setRangeInputValue(percent.toFixed());
		}
	} else {
		setTotalState('');
		setTotalValid(false);
	}
}
