import { memo, useContext, useMemo } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ReactComponent as ClockIcon } from '@/assets/images/UI/clock_icon.svg';
import { Store } from '@/store/store-reducer';
import PairData from '@/interfaces/common/PairData';
import { ContextState } from '@/interfaces/common/ContextValue';
import { tradingKnownCurrencies, roundTo, notationToString } from '@/utils/utils';
import styles from './PairsTable.module.scss';

type Currency = {
	code: string;
	name: string;
	whitelisted?: boolean;
	featured?: boolean;
};

type Row = {
	id: string;
	pair: {
		base: Currency;
		quote: Currency;
	};
	price: number;
	priceUSD: string;
	change: number;
	volume: number;
	volumeUSD: string;
	featured: boolean;
	code: string;
};

function transformPairsToRows(pairs: PairData[], state: ContextState): Row[] {
	return pairs.map((pair) => {
		const secondAssetUsdPrice = state.assetsRates.get(pair.second_currency.asset_id || '') ?? 0;

		const price = Number(roundTo(notationToString(pair.rate ?? 0)));
		const currentPriceUSD = secondAssetUsdPrice ? price : 0;
		const priceUSD = currentPriceUSD
			? String(`$${(secondAssetUsdPrice * price).toFixed(2)}`)
			: String(`$${(secondAssetUsdPrice * price).toFixed(0)}`);

		const volume = Number(roundTo(notationToString(pair.volume ?? 0)));
		const currentVolumeUSD = secondAssetUsdPrice ? volume : 0;
		const volumeUSD = currentVolumeUSD
			? String(`$${(secondAssetUsdPrice * volume).toFixed(2)}`)
			: String(`$${(secondAssetUsdPrice * volume).toFixed(0)}`);

		return {
			id: pair.id,
			pair: {
				base: pair.first_currency,
				quote: pair.second_currency,
			},
			price,
			priceUSD,
			change: pair?.coefficient || 0,
			volume,
			volumeUSD,
			featured: pair.featured,
			code: tradingKnownCurrencies.includes(pair.first_currency?.code)
				? pair.first_currency?.code
				: 'tsds',
		};
	});
}

interface IProps {
	data: PairData[];
}

function PairsTable({ data }: IProps) {
	const router = useRouter();
	const { state } = useContext(Store);

	const columns = useMemo<ColumnDef<Row>[]>(
		() => [
			{
				accessorKey: 'pair',
				header: 'Trading Pair',
				cell: ({ row }) => {
					const {
						pair: { base, quote },
						code,
						featured,
					} = row.original;
					return (
						<div className={styles.pair_cell}>
							<Image
								width={18}
								height={18}
								src={`/currencies/trade_${code}.svg`}
								alt="currency"
							/>
							<div className={styles.currency_name}>
								<span>{base.name}</span>
								<span>/</span>
								<span>{quote.name}</span>
							</div>

							{featured && (
								<Image
									src="/ui/featured.svg"
									alt="featured"
									width={24}
									height={24}
								/>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: 'price',
				header: ({ table }) => {
					const row = table.options.data[0] as Row;
					const name = row?.pair.quote.name;

					return `Price ${name ? `(${name})` : ''}`;
				},
				cell: ({ row }) => (
					<div className={styles.price_cell}>
						<div className={styles.text}>
							{roundTo(notationToString(row.original.price))}
						</div>
						<div className={styles.sub_text}>{row.original.priceUSD}</div>
					</div>
				),
			},
			{
				accessorKey: 'change',
				header: () => (
					<div className={styles.header_column_row}>
						<ClockIcon />
						24h Change
					</div>
				),
				cell: ({ row }) => {
					const coefficient = row.original.change;
					const coefficientOutput =
						parseFloat(coefficient?.toFixed(2) || '0') === -100
							? -99.99
							: parseFloat(coefficient?.toFixed(2) || '0');

					return (
						<span
							className={styles.coefficient_cell}
							style={{ color: coefficient >= 0 ? '#16D1D6' : '#FF6767' }}
						>
							{coefficient >= 0 ? '+' : ''}
							{coefficientOutput}%
						</span>
					);
				},
			},
			{
				accessorKey: 'volume',
				header: () => (
					<div className={styles.header_column_row}>
						<ClockIcon />
						24h Volume
					</div>
				),
				cell: ({ row }) => (
					<div className={styles.price_cell}>
						<div className={styles.text}>
							{roundTo(notationToString(row.original?.volume ?? 0), 8)}
						</div>
						<div className={styles.sub_text}>{row.original.volumeUSD}</div>
					</div>
				),
			},
			{
				id: 'action',
				header: '',
				cell: ({ row }) => (
					<div className={styles.button_cell}>
						<button
							className={styles.trade_button}
							onClick={() => router.push(`/dex/trading/${row.original.id}`)}
						>
							Trade
						</button>
					</div>
				),
			},
		],
		[],
	);

	const table = useReactTable({
		data: transformPairsToRows(data, state),
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<table className={styles.table}>
			<thead>
				{table.getHeaderGroups().map((headerGroup) => (
					<tr key={headerGroup.id} className={styles.header_row}>
						{headerGroup.headers.map((header) => (
							<th key={header.id} className={styles.header_cell}>
								{flexRender(header.column.columnDef.header, header.getContext())}
							</th>
						))}
					</tr>
				))}
			</thead>
			<tbody>
				{table.getRowModel().rows.map((row) => (
					<tr key={row.id} className={styles.body_row}>
						{row.getVisibleCells().map((cell) => (
							<td key={cell.id} className={styles.body_cell}>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

export default memo(PairsTable);
