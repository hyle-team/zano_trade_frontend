import { classes } from '@/utils/utils';
import React from 'react';
import EmptyMessage from '@/components/UI/EmptyMessage';
import { GenericTableProps } from './types';

export default function GenericTable<T>(props: GenericTableProps<T>) {
	const {
		className,
		tableClassName,
		theadClassName,
		tbodyClassName,
		columns,
		data,
		getRowKey,
		emptyMessage = 'No data',
	} = props;

	return (
		<div className={className}>
			{data.length > 0 ? (
				<div className="orders-scroll" style={{ maxHeight: '100%', overflowY: 'auto' }}>
					<table
						className={tableClassName}
						style={{
							tableLayout: 'fixed',
							width: '100%',
							borderCollapse: 'separate',
							borderSpacing: 0,
						}}
					>
						<colgroup>
							{columns.map((col) => (
								<col
									key={col.key}
									style={col.width ? { width: col.width } : undefined}
								/>
							))}
						</colgroup>

						<thead className={theadClassName}>
							<tr>
								{columns.map((col) => (
									<th
										key={col.key}
										className={col.className}
										style={{
											position: 'sticky',
											top: 0,
											zIndex: 2,
											background: 'var(--window-bg-color)',
											textAlign: col.align ?? 'left',
											whiteSpace: 'nowrap',
											overflowX: 'hidden',
											textOverflow: 'ellipsis',
											padding: '6px 10px',
											fontSize: 11,
											fontWeight: 700,
										}}
									>
										{col.header}
									</th>
								))}
							</tr>
						</thead>

						<tbody className={tbodyClassName}>
							{data.map((row, i) => (
								<tr key={getRowKey(row, i)}>
									{columns.map((col) => (
										<td
											key={col.key}
											className={classes(col.className)}
											style={{
												textAlign: col.align ?? 'left',
												whiteSpace: 'nowrap',
												textOverflow: 'ellipsis',
												padding: '6px 10px',
												verticalAlign: 'middle',
												position: 'relative',
											}}
										>
											{col.cell(row, i)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<EmptyMessage text={emptyMessage} />
			)}
		</div>
	);
}
