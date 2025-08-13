import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { notationToString } from '@/utils/utils';
import Decimal from 'decimal.js';
import React from 'react';
import PairDataType from '@/interfaces/common/PairData';
import OrderFormOutput from '@/interfaces/common/orderFormOutput';
import { handleInputChange } from './handleInputChange';

interface takeOrderClickParams {
	event:
		| React.MouseEvent<HTMLAnchorElement, MouseEvent>
		| React.MouseEvent<HTMLTableRowElement, MouseEvent>;
	PageOrderData: PageOrderData;
	pairData: PairDataType | null;
	buyForm: OrderFormOutput;
	sellForm: OrderFormOutput;
	balance: string | undefined;
	scrollToOrderForm: () => void;
}

function takeOrderClick({
	event,
	PageOrderData,
	pairData,
	buyForm,
	sellForm,
	balance,
	scrollToOrderForm,
}: takeOrderClickParams) {
	event.preventDefault();
	const e = PageOrderData;

	const priceStr = notationToString(new Decimal(e.price).toString()) || '';
	const amountStr = notationToString(new Decimal(e.amount).toString()) || '';

	const secondCurrencyDP = pairData?.second_currency?.asset_info?.decimal_point || 12;
	const firstCurrencyDP = pairData?.first_currency?.asset_info?.decimal_point || 12;

	if (e.type === 'sell') {
		handleInputChange({
			inputValue: priceStr,
			priceOrAmount: 'price',
			otherValue: amountStr,
			thisDP: secondCurrencyDP,
			totalDP: secondCurrencyDP,
			setThisState: buyForm.setPrice,
			setTotalState: buyForm.setTotal,
			setThisValid: buyForm.setPriceValid,
			setTotalValid: buyForm.setTotalValid,
		});

		handleInputChange({
			inputValue: amountStr,
			priceOrAmount: 'amount',
			otherValue: priceStr,
			thisDP: firstCurrencyDP,
			totalDP: secondCurrencyDP,
			setThisState: buyForm.setAmount,
			setTotalState: buyForm.setTotal,
			setThisValid: buyForm.setAmountValid,
			setTotalValid: buyForm.setTotalValid,
			balance,
			setRangeInputValue: buyForm.setRangeInputValue,
		});
	} else {
		handleInputChange({
			inputValue: priceStr,
			priceOrAmount: 'price',
			otherValue: amountStr,
			thisDP: secondCurrencyDP,
			totalDP: secondCurrencyDP,
			setThisState: sellForm.setPrice,
			setTotalState: sellForm.setTotal,
			setThisValid: sellForm.setPriceValid,
			setTotalValid: sellForm.setTotalValid,
		});

		handleInputChange({
			inputValue: amountStr,
			priceOrAmount: 'amount',
			otherValue: priceStr,
			thisDP: firstCurrencyDP,
			totalDP: secondCurrencyDP,
			setThisState: sellForm.setAmount,
			setTotalState: sellForm.setTotal,
			setThisValid: sellForm.setAmountValid,
			setTotalValid: sellForm.setTotalValid,
			balance,
			setRangeInputValue: sellForm.setRangeInputValue,
		});
	}

	scrollToOrderForm();
}

export default takeOrderClick;
