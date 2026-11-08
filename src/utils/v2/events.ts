import Decimal from 'decimal.js';
import { OrderDataWithPair } from '@/interfaces/responses/orders/GetOrdersPageRes';
import socket, { SocketEvent } from '@/utils/socket';
import { V2NewOrderMatchEvent, V2Order, V2Pair } from './types';
import { toOrderDataWithPair } from './mappers';
import { getV2Pair } from './client';

const fromAtomics = (value: string | null, decimalPoint: number) =>
	value === null ? null : new Decimal(value).div(new Decimal(10).pow(decimalPoint)).toFixed();

export function normalizeEventOrder<T extends V2Order>(order: T, pair: V2Pair): T {
	const baseDP = pair.baseAsset.decimalPoint;
	const quoteDP = pair.quoteAsset.decimalPoint;

	return {
		...order,
		amount: fromAtomics(order.amountInAtomics, baseDP) ?? order.amount,
		left: fromAtomics(order.leftInAtomics, baseDP) ?? order.left,
		price: fromAtomics(order.priceInAtomics, quoteDP) ?? order.price,
		minPerApplyAmount: fromAtomics(order.minPerApplyAmountInAtomics, baseDP),
		maxPerApplyAmount: fromAtomics(order.maxPerApplyAmountInAtomics, baseDP),
	};
}

export function onOrderMatchNotification(
	handler: (_orderData: OrderDataWithPair & { matchingOrderId: string }) => void,
) {
	let active = true;

	const listener = async (payload: V2NewOrderMatchEvent) => {
		if (!payload?.pairId) return;

		const pairRes = await getV2Pair(payload.pairId).catch(() => null);
		if (!active || !pairRes?.success) return;

		const order = normalizeEventOrder(payload, pairRes.result);

		handler({
			...toOrderDataWithPair(order, pairRes.result),
			matchingOrderId: payload.matchingOrderId,
		});
	};

	socket.on(SocketEvent.NEW_ORDER_MATCH, listener);

	return () => {
		active = false;
		socket.off(SocketEvent.NEW_ORDER_MATCH, listener);
	};
}
