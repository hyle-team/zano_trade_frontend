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
	orderForm: OrderFormOutput;
	balance: string | undefined;
	scrollToOrderForm: () => void;
}

function takeOrderClick({
	event,
	PageOrderData,
	pairData,
	orderForm,
	balance,
	scrollToOrderForm,
}: takeOrderClickParams) {
	event.preventDefault();
	const e = PageOrderData;

	const priceStr = notationToString(new Decimal(e.price).toString()) || '';
	const amountStr = notationToString(new Decimal(e.left).toString()) || '';

	const secondCurrencyDP = pairData?.second_currency?.asset_info?.decimal_point || 12;
	const firstCurrencyDP = pairData?.first_currency?.asset_info?.decimal_point || 12;

	handleInputChange({
		inputValue: priceStr,
		priceOrAmount: 'price',
		otherValue: amountStr,
		thisDP: secondCurrencyDP,
		totalDP: secondCurrencyDP,
		setThisState: orderForm.setPrice,
		setTotalState: orderForm.setTotal,
		setThisValid: orderForm.setPriceValid,
		setTotalValid: orderForm.setTotalValid,
	});

	handleInputChange({
		inputValue: amountStr,
		priceOrAmount: 'amount',
		otherValue: priceStr,
		thisDP: firstCurrencyDP,
		totalDP: secondCurrencyDP,
		setThisState: orderForm.setAmount,
		setTotalState: orderForm.setTotal,
		setThisValid: orderForm.setAmountValid,
		setTotalValid: orderForm.setTotalValid,
		balance,
		setRangeInputValue: orderForm.setRangeInputValue,
	});

	scrollToOrderForm();
}

export default takeOrderClick;
