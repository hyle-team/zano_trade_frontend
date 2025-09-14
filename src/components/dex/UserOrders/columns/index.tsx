import { notationToString, formatTimestamp } from '@/utils/utils';
import type OrderRow from '@/interfaces/common/OrderRow';
import type { ColumnDef } from '@/components/default/GenericTable/types';
import ApplyTip from '@/interfaces/common/ApplyTip';
import UserPendingType from '@/interfaces/common/UserPendingType';
import { UserOrderData } from '@/interfaces/responses/orders/GetUserOrdersRes';
import CancelActionCell from '../components/CancelActionCell';
import AliasCell from '../../AliasCell';
import TotalUsdCell from '../../TotalUsdCell';
import RequestActionCell from '../components/RequestActionCell';
import {
	BuildApplyTipsColumnsArgs,
	BuildMyRequestsColumnsArgs,
	BuildOrderHistoryColumnsArgs,
	BuildUserColumnsArgs,
} from './types';

export function buildUserColumns({
	firstCurrencyName,
	secondCurrencyName,
	secondAssetUsdPrice,
	matchesCountByOrderId,
	offersCountByOrderId,
	requestsCountByOrderId,
	onAfter,
}: BuildUserColumnsArgs): ColumnDef<OrderRow>[] {
	return [
		{
			key: 'pair',
			header: 'Pair',
			width: '120px',
			cell: (row) => (
				<p
					style={
						{
							'--direction-color': row.type === 'buy' ? '#16D1D6' : '#FF6767',
						} as React.CSSProperties
					}
				>
					{firstCurrencyName}/{secondCurrencyName}
				</p>
			),
		},
		{
			key: 'direction',
			header: 'Direction',
			width: '110px',
			cell: (row) => (
				<p
					style={{
						color: row.type === 'buy' ? '#16D1D6' : '#FF6767',
						textTransform: 'capitalize',
					}}
				>
					{row.type}
				</p>
			),
		},
		{
			key: 'price',
			header: <>Price ({secondCurrencyName})</>,
			width: '150px',
			cell: (row) => <p>{notationToString(row.price)}</p>,
		},
		{
			key: 'quantity',
			header: <>Quantity ({firstCurrencyName})</>,
			width: '160px',
			cell: (row) => <p>{notationToString(row.left)}</p>,
		},
		{
			key: 'total',
			header: <>Total ({secondCurrencyName})</>,
			width: '180px',
			cell: (row) => (
				<TotalUsdCell
					amount={row.left}
					price={row.price}
					secondAssetUsdPrice={secondAssetUsdPrice}
				/>
			),
		},
		{
			key: 'matches',
			header: 'Matches',
			width: '70px',
			cell: (row) => {
				const count = matchesCountByOrderId[row.id] ?? 0;

				return (
					<p
						style={{
							fontWeight: 500,
							color: count > 0 ? '#1F8FEB' : '#B6B6C4',
						}}
					>
						{count}
					</p>
				);
			},
		},
		{
			key: 'requests',
			header: 'Requests',
			width: '70px',
			cell: (row) => {
				const count = requestsCountByOrderId[row.id] ?? 0;

				return (
					<p
						style={{
							fontWeight: 500,
							color: count > 0 ? '#1F8FEB' : '#B6B6C4',
						}}
					>
						{count}
					</p>
				);
			},
		},
		{
			key: 'offers',
			header: 'Offers',
			width: '70px',
			cell: (row) => {
				const count = offersCountByOrderId[row.id] ?? 0;

				return (
					<p
						style={{
							fontWeight: 500,
							color: count > 0 ? '#1F8FEB' : '#B6B6C4',
						}}
					>
						{count}
					</p>
				);
			},
		},
		{
			key: 'time',
			header: 'Time',
			width: '180px',
			cell: (row) => <p>{formatTimestamp(row.timestamp)}</p>,
		},
		{
			key: 'action',
			header: 'Action',
			width: '80px',
			align: 'left',
			cell: (row) => <CancelActionCell id={row.id} onAfter={onAfter} />,
		},
	];
}

export function buildApplyTipsColumns({
	type,
	firstCurrencyName,
	secondCurrencyName,
	matrixAddresses,
	secondAssetUsdPrice,
	userOrders,
	pairData,
	onAfter,
}: BuildApplyTipsColumnsArgs): ColumnDef<ApplyTip>[] {
	return [
		{
			key: 'alias',
			header: 'Alias',
			width: '180px',
			cell: (row) => (
				<AliasCell
					alias={row.user?.alias}
					address={row.user?.address}
					matrixAddresses={matrixAddresses}
					isInstant={row.isInstant}
				/>
			),
		},
		{
			key: 'price',
			header: <>Price ({secondCurrencyName})</>,
			width: '150px',
			cell: (row) => <p>{notationToString(row.price)}</p>,
		},
		{
			key: 'quantity',
			header: <>Quantity ({firstCurrencyName})</>,
			width: '160px',
			cell: (row) => <p>{notationToString(row.left)}</p>,
		},
		{
			key: 'total',
			header: <>Total ({secondCurrencyName})</>,
			width: '180px',
			cell: (row) => (
				<TotalUsdCell
					amount={row.left}
					price={row.price}
					secondAssetUsdPrice={secondAssetUsdPrice}
				/>
			),
		},
		{
			key: 'time',
			header: 'Time',
			width: '180px',
			cell: (row) => <p>{formatTimestamp(Number(row.timestamp))}</p>,
		},
		{
			key: 'action',
			header: 'Action',
			width: type === 'offers' ? '140px' : '90px',
			cell: (row) => (
				<div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
					<RequestActionCell
						type={type === 'suitables' ? 'request' : 'accept'}
						row={row}
						pairData={pairData}
						connectedOrder={userOrders.find((o) => o.id === row.connected_order_id)}
						onAfter={onAfter}
					/>
					{type === 'offers' && (
						<CancelActionCell
							type="reject"
							id={row.connected_order_id}
							onAfter={onAfter}
						/>
					)}
				</div>
			),
		},
	];
}

export function buildMyRequestsColumns({
	firstCurrencyName,
	secondCurrencyName,
	matrixAddresses,
	secondAssetUsdPrice,
	onAfter,
}: BuildMyRequestsColumnsArgs): ColumnDef<UserPendingType>[] {
	return [
		{
			key: 'alias',
			header: 'Alias',
			width: '180px',
			cell: (row) => (
				<AliasCell
					alias={row.finalizer?.alias}
					address={row.finalizer?.address}
					matrixAddresses={matrixAddresses}
				/>
			),
		},
		{
			key: 'price',
			header: <>Price ({secondCurrencyName})</>,
			width: '150px',
			cell: (row) => <p>{notationToString(row.price)}</p>,
		},
		{
			key: 'quantity',
			header: <>Quantity ({firstCurrencyName})</>,
			width: '160px',
			cell: (row) => <p>{notationToString(row.amount)}</p>,
		},
		{
			key: 'total',
			header: <>Total ({secondCurrencyName})</>,
			width: '180px',
			cell: (row) => (
				<TotalUsdCell
					amount={row.amount}
					price={row.price}
					secondAssetUsdPrice={secondAssetUsdPrice}
				/>
			),
		},
		{
			key: 'time',
			header: 'Time',
			width: '180px',
			cell: (row) => <p>{formatTimestamp(row.timestamp)}</p>,
		},
		{
			key: 'action',
			header: 'Action',
			width: '80px',
			align: 'left',
			cell: (row) => (
				<CancelActionCell
					id={String(row.creator === 'sell' ? row.sell_order_id : row.buy_order_id)}
					onAfter={onAfter}
				/>
			),
		},
	];
}

export function buildOrderHistoryColumns({
	firstCurrencyName,
	secondCurrencyName,
	secondAssetUsdPrice,
}: BuildOrderHistoryColumnsArgs): ColumnDef<UserOrderData>[] {
	return [
		{
			key: 'pair',
			header: 'Pair',
			width: '120px',
			cell: (row) => (
				<p
					style={
						{
							'--direction-color': row.type === 'buy' ? '#16D1D6' : '#FF6767',
						} as React.CSSProperties
					}
				>
					{firstCurrencyName}/{secondCurrencyName}
				</p>
			),
		},
		{
			key: 'direction',
			header: 'Direction',
			width: '110px',
			cell: (row) => (
				<p
					style={{
						color: row.type === 'buy' ? '#16D1D6' : '#FF6767',
						textTransform: 'capitalize',
					}}
				>
					{row.type}
				</p>
			),
		},
		{
			key: 'price',
			header: <>Price ({secondCurrencyName})</>,
			width: '150px',
			cell: (row) => <p>{notationToString(row.price)}</p>,
		},
		{
			key: 'quantity',
			header: <>Quantity ({firstCurrencyName})</>,
			width: '160px',
			cell: (row) => <p>{notationToString(row.left)}</p>,
		},
		{
			key: 'total',
			header: <>Total ({secondCurrencyName})</>,
			width: '180px',
			cell: (row) => (
				<TotalUsdCell
					amount={row.left}
					price={row.price}
					secondAssetUsdPrice={secondAssetUsdPrice}
				/>
			),
		},
		{
			key: 'time',
			header: 'Time',
			width: '100px',
			cell: (row) => <p>{formatTimestamp(row.timestamp)}</p>,
		},
	];
}
