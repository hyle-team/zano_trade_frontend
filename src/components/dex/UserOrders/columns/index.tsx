import { notationToString, formatTimestamp } from '@/utils/utils';
import type OrderRow from '@/interfaces/common/OrderRow';
import type { ColumnDef } from '@/components/default/GenericTable/types';
import ApplyTip from '@/interfaces/common/ApplyTip';
import UserPendingType from '@/interfaces/common/UserPendingType';
import CancelActionCell from '../components/CancelActionCell';
import AliasCell from '../../AliasCell';
import TotalUsdCell from '../../TotalUsdCell';
import RequestActionCell from '../components/RequestActionCell';
import ItemsCountCell from '../components/ItemsCountCell';
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
	onOpenItems,
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
							'--direction-color':
								row.type === 'buy' ? 'var(--green-color)' : 'var(--red-color)',
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
						color: row.type === 'buy' ? 'var(--green-color)' : 'var(--red-color)',
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
			key: 'min_per_apply_amount',
			header: <>Min Per Apply ({firstCurrencyName})</>,
			width: '160px',
			cell: (row) => (
				<p>
					{row.min_per_apply_amount ? notationToString(row.min_per_apply_amount) : 'No'}
				</p>
			),
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
			cell: (row) => (
				<ItemsCountCell
					count={row.matches_count ?? 0}
					onClick={() => onOpenItems('matches', row)}
				/>
			),
		},
		{
			key: 'requests',
			header: 'Requests',
			width: '70px',
			cell: (row) => (
				<ItemsCountCell
					count={row.incoming_proposals_count ?? 0}
					onClick={() => onOpenItems('requests', row)}
				/>
			),
		},
		{
			key: 'offers',
			header: 'Offers',
			width: '70px',
			cell: (row) => (
				<ItemsCountCell
					count={row.outgoing_proposals_count ?? 0}
					onClick={() => onOpenItems('offers', row)}
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
						<CancelActionCell type="reject" id={row.id} onAfter={onAfter} />
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
				<CancelActionCell type="cancel_tx" id={row.id.toString()} onAfter={onAfter} />
			),
		},
	];
}

export function buildOrderHistoryColumns({
	firstCurrencyName,
	secondCurrencyName,
	secondAssetUsdPrice,
}: BuildOrderHistoryColumnsArgs): ColumnDef<OrderRow>[] {
	return [
		{
			key: 'pair',
			header: 'Pair',
			width: '120px',
			cell: (row) => (
				<p
					style={
						{
							'--direction-color':
								row.type === 'buy' ? 'var(--green-color)' : 'var(--red-color)',
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
			width: '70px',
			cell: (row) => (
				<p
					style={{
						color: row.type === 'buy' ? 'var(--green-color)' : 'var(--red-color)',
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
			cell: (row) => <p>{notationToString(row.amount)}</p>,
		},
		{
			key: 'quantity',
			header: <>Min Per Apply ({firstCurrencyName})</>,
			width: '160px',
			cell: (row) => (
				<p>
					{row.min_per_apply_amount !== null
						? notationToString(row.min_per_apply_amount)
						: 'No'}
				</p>
			),
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
	];
}
