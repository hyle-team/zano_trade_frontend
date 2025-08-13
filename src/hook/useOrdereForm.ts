import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import PairData from '@/interfaces/common/PairData';
import OrderFormOutput from '@/interfaces/common/orderFormOutput';
import { handleInputChange } from '@/utils/handleInputChange';

interface UseOrderFormParams {
	type: 'buy' | 'sell';
	pairData: PairData | null;
	balance: string | undefined;
	assetsRates: Map<string, number>;
}

export function useOrderForm({
	type,
	pairData,
	balance,
	assetsRates,
}: UseOrderFormParams): OrderFormOutput {
	const [price, setPrice] = useState('');
	const [amount, setAmount] = useState('');
	const [total, setTotal] = useState('');

	const [priceValid, setPriceValid] = useState(false);
	const [amountValid, setAmountValid] = useState(false);
	const [totalValid, setTotalValid] = useState(false);

	const [totalUsd, setTotalUsd] = useState<string | undefined>(undefined);
	const [rangeInputValue, setRangeInputValue] = useState('50');

	const priceDP = pairData?.second_currency?.asset_info?.decimal_point || 12;
	const amountDP = pairData?.first_currency?.asset_info?.decimal_point || 12;

	useEffect(() => {
		try {
			const totalDecimal = new Decimal(total);
			const zanoPrice = assetsRates.get(pairData?.second_currency?.asset_id || '');
			setTotalUsd(zanoPrice ? totalDecimal.mul(zanoPrice).toFixed(2) : undefined);
		} catch (err) {
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
			setTotalState: setTotal,
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
			setTotalState: setTotal,
			setThisValid: setAmountValid,
			setTotalValid,
			balance,
			setRangeInputValue,
		});
	}

	function resetForm() {
		setPrice('');
		setAmount('');
		setTotal('');
		setPriceValid(false);
		setAmountValid(false);
		setTotalValid(false);
		setRangeInputValue('50');
	}

	return {
		price,
		amount,
		total,
		priceValid,
		amountValid,
		totalValid,
		totalUsd,
		rangeInputValue,
		setRangeInputValue,
		onPriceChange,
		onAmountChange,
		resetForm,
		setTotal,
		setPrice,
		setAmount,
		setPriceValid,
		setAmountValid,
		setTotalValid,
	};
}
