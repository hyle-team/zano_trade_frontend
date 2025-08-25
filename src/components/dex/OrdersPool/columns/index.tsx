import { formatTimestamp, notationToString } from '@/utils/utils';
import { ColumnDef } from '@/components/default/GenericTable/types';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import { BuildOrderPoolColumnsArgs, BuildTradesColumnsArgs } from './types';
import TotalUsdCell from '../../TotalUsdCell';
import AliasCell from '../../AliasCell';

export function buildOrderPoolColumns({
	firstCurrencyName,
	secondCurrencyName,
	matrixAddresses,
}: BuildOrderPoolColumnsArgs): ColumnDef<PageOrderData>[] {
	return [
		{
			key: 'alias',
			header: 'Alias',
			width: '100px',
			className: 'alias',
			cell: (row) => (
				<AliasCell
					alias={row.user?.alias}
					address={row.user?.address}
					matrixAddresses={matrixAddresses}
					isInstant={row.isInstant}
					max={7}
				/>
			),
		},
		{
			key: 'price',
			header: <>Price ({secondCurrencyName})</>,
			width: '80px',
			cell: (row) => (
				<p style={{ color: row.type === 'buy' ? '#16D1D6' : '#FF6767' }}>
					{notationToString(row.price, 8)}
				</p>
			),
		},
		{
			key: 'quantity',
			header: <>Qty ({firstCurrencyName})</>,
			width: '80px',
			cell: (row) => <p>{notationToString(row.amount, 8)}</p>,
		},
		{
			key: 'total',
			header: <>Total ({secondCurrencyName})</>,
			width: '80px',
			cell: (row) => <TotalUsdCell amount={row.left} price={row.price} fixed={8} />,
		},
	];
}

export function buildTradesColumns({
	firstCurrencyName,
	secondCurrencyName,
}: BuildTradesColumnsArgs): ColumnDef<Trade>[] {
	return [
		{
			key: 'price',
			header: <>Price ({secondCurrencyName})</>,
			width: '80px',
			cell: (row) => (
				<p style={{ color: row.type === 'buy' ? '#16D1D6' : '#FF6767' }}>
					{notationToString(row.price)}
				</p>
			),
		},
		{
			key: 'quantity',
			header: <>Qty ({firstCurrencyName})</>,
			width: '80px',
			cell: (row) => <p>{notationToString(row.amount)}</p>,
		},
		{
			key: 'time',
			header: <>Time</>,
			width: '80px',
			cell: (row) => <p>{formatTimestamp(row.timestamp)}</p>,
		},
	];
}
