import { formatTimestamp, notationToString } from '@/utils/utils';
import { ColumnDef } from '@/components/default/GenericTable/types';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { Trade } from '@/interfaces/responses/trades/GetTradeRes';
import { BuildColumnsArgs } from './types';
import TotalUsdCell from '../../TotalUsdCell';
import styles from '../styles.module.scss';

export function buildOrderPoolColumns({
	firstCurrencyName,
	secondCurrencyName,
}: BuildColumnsArgs): ColumnDef<PageOrderData>[] {
	return [
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
			cell: (row) => <p>{notationToString(row.left, 8)}</p>,
		},
		{
			key: 'total',
			header: <>Total ({secondCurrencyName})</>,
			width: '80px',
			align: 'right',
			className: styles.hideTotalSm,
			cell: (row) => <TotalUsdCell amount={row.left} price={row.price} fixed={8} />,
		},
	];
}

export function buildTradesColumns({
	firstCurrencyName,
	secondCurrencyName,
}: BuildColumnsArgs): ColumnDef<Trade>[] {
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
			align: 'right',
			header: <>Time</>,
			width: '80px',
			cell: (row) => <p>{formatTimestamp(row.timestamp)}</p>,
		},
	];
}
