import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { validateTokensInput } from 'shared/utils';

import PairData from '@/interfaces/common/PairData';
import OrderFormOutput from '@/interfaces/common/orderFormOutput';
import { handleInputChange } from '@/utils/handleInputChange';
import { isPositiveFloatStr } from '@/utils/utils';

enum FieldValidationResult {
	DO_NOT_WRITE = 'DO_NOT_WRITE',
	INVALID = 'INVALID',
	VALID = 'VALID',
}

interface UseOrderFormParams {
	pairData: PairData | null;
	balance: string | undefined;
	assetsRates: Map<string, number>;
}

function clamp12(str: string) {
	try {
		return new Decimal(str || '0').toDecimalPlaces(12, Decimal.ROUND_DOWN).toString();
	} catch {
		return '0';
	}
}

export function useOrderForm({
	pairData,
	balance,
	assetsRates,
}: UseOrderFormParams): OrderFormOutput {
	const [price, setPrice] = useState('');
	const [amount, setAmount] = useState('');
	const [total, setTotal] = useState('');

	// Optional fields
	const [minPerApplyAmount, setMinPerApplyAmount] = useState('');

	const [priceValid, setPriceValid] = useState(false);
	const [amountValid, setAmountValid] = useState(false);
	const [totalValid, setTotalValid] = useState(false);

	// Optional field validity
	const [minPerApplyAmountValid, setMinPerApplyAmountValid] = useState(false);

	const [totalUsd, setTotalUsd] = useState<string | undefined>(undefined);
	const [rangeInputValue, setRangeInputValue] = useState('50');

	const priceDP = pairData?.second_currency?.asset_info?.decimal_point || 12;
	const amountDP = pairData?.first_currency?.asset_info?.decimal_point || 12;

	useEffect(() => {
		try {
			const totalDecimal = new Decimal(total);
			const zanoPrice = assetsRates.get(pairData?.second_currency?.asset_id || '');
			setTotalUsd(zanoPrice ? totalDecimal.mul(zanoPrice).toFixed(2) : undefined);
		} catch {
			setTotalUsd(undefined);
		}
	}, [total, assetsRates, pairData?.second_currency?.asset_id]);

	function onPriceChange(inputValue: string) {
		handleInputChange({
			inputValue,
			priceOrAmount: 'price',
			otherValue: amount,
			thisDP: priceDP,
			totalDP: priceDP,
			setThisState: setPrice,
			setTotalState: (v: string) => setTotal(clamp12(v)),
			setThisValid: setPriceValid,
			setTotalValid,
		});
	}

	function onAmountChange(inputValue: string) {
		handleInputChange({
			inputValue,
			priceOrAmount: 'amount',
			otherValue: price,
			thisDP: amountDP,
			totalDP: priceDP,
			setThisState: setAmount,
			setTotalState: (v: string) => setTotal(clamp12(v)),
			setThisValid: setAmountValid,
			setTotalValid,
			balance,
			setRangeInputValue,
		});

		const minPerApplyAmountValidationResult = validateMinPerApplyAmount({
			inputValue: minPerApplyAmount,
			amount: inputValue,
		});

		if (minPerApplyAmountValidationResult !== FieldValidationResult.DO_NOT_WRITE) {
			const isValid = minPerApplyAmountValidationResult === FieldValidationResult.VALID;

			setMinPerApplyAmountValid(isValid);
		}
	}

	function validateMinPerApplyAmount({
		inputValue,
		amount,
	}: {
		inputValue: string;
		amount: string;
	}): FieldValidationResult {
		try {
			if (inputValue !== '' && !isPositiveFloatStr(inputValue)) {
				return FieldValidationResult.DO_NOT_WRITE;
			}

			const { valid: validTokensInput } = validateTokensInput(inputValue, amountDP);

			if (!validTokensInput) {
				return FieldValidationResult.INVALID;
			}

			const amountDecimal = new Decimal(amount);
			const minPerApplyAmountDecimal = new Decimal(inputValue);

			const minPerApplyGreaterThanAmount = minPerApplyAmountDecimal.gt(amountDecimal);

			if (minPerApplyGreaterThanAmount) {
				return FieldValidationResult.INVALID;
			}

			return FieldValidationResult.VALID;
		} catch {
			return FieldValidationResult.INVALID;
		}
	}

	function onMinPerApplyAmountChange(inputValue: string) {
		const validationResult = validateMinPerApplyAmount({ inputValue, amount });

		if (validationResult === FieldValidationResult.DO_NOT_WRITE) {
			return;
		}

		const isValid = validationResult === FieldValidationResult.VALID;

		setMinPerApplyAmount(inputValue);
		setMinPerApplyAmountValid(isValid);
	}

	function resetForm() {
		setPrice('');
		setAmount('');
		setTotal('');
		setMinPerApplyAmount('');
		setPriceValid(false);
		setAmountValid(false);
		setTotalValid(false);
		setRangeInputValue('50');
	}

	return {
		price,
		amount,
		total,
		minPerApplyAmount,
		priceValid,
		amountValid,
		totalValid,
		minPerApplyAmountValid,
		totalUsd,
		rangeInputValue,
		setRangeInputValue,
		onPriceChange,
		onAmountChange,
		onMinPerApplyAmountChange,
		resetForm,
		setTotal,
		setPrice,
		setAmount,
		setMinPerApplyAmount,
		setPriceValid,
		setAmountValid,
		setTotalValid,
		setMinPerApplyAmountValid,
	};
}
