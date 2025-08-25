import { useMemo } from 'react';
import Decimal from 'decimal.js';
import { notationToString, formatDollarValue } from '@/utils/utils';
import { TotalUsdCellProps } from './types';

export default function TotalUsdCell({
	amount,
	price,
	secondAssetUsdPrice,
	fixed,
}: TotalUsdCellProps) {
	const total = useMemo(
		() => new Decimal(amount || 0).mul(new Decimal(price || 0)),
		[amount, price],
	);
	const usd = secondAssetUsdPrice ? total.mul(secondAssetUsdPrice).toFixed(2) : undefined;

	return (
		<p>
			{notationToString((fixed ? total.toFixed(fixed) : total).toString())}{' '}
			{secondAssetUsdPrice && <span>~ ${usd && formatDollarValue(usd)}</span>}
		</p>
	);
}
