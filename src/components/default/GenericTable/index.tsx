import { classes } from '@/utils/utils';
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import EmptyMessage from '@/components/UI/EmptyMessage';
import { useMediaQuery } from '@/hook/useMediaQuery';
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
		getRowProps,
		groupBy,
		renderGroupHeader,
		sortGroups,
		responsive,
		centerBoundaryOnMount,
	} = props;

	const scrollRef = useRef<HTMLDivElement | null>(null);
	const isMatch = useMediaQuery(responsive?.query ?? '');
	const mediaActive = !!responsive?.query && isMatch;

	const effectiveColumns = useMemo(() => {
		let cols = columns;

		if (mediaActive && responsive?.hiddenKeys?.length) {
			const hide = new Set(responsive.hiddenKeys);
			cols = cols.filter((c) => !hide.has(c.key));
		}

		if (mediaActive && responsive?.alignOverride) {
			cols = cols.map((c) => {
				const ov = responsive.alignOverride![c.key];
				return ov ? { ...c, align: ov } : c;
			});
		}

		return cols;
	}, [columns, mediaActive, responsive]);

	const grouped = useMemo(() => {
		if (!groupBy) return [{ key: '__all__', items: data }];

		const map = new Map<string, T[]>();
		for (const item of data) {
			const k = String(groupBy(item));
			const bucket = map.get(k) ?? [];
			bucket.push(item);
			map.set(k, bucket);
		}
		const entries = Array.from(map.entries());
		if (sortGroups) entries.sort((a, b) => sortGroups(a[0], b[0]));
		return entries.map(([key, items]) => ({ key, items }));
	}, [data, groupBy, sortGroups]);

	// Scroll center
	useLayoutEffect(() => {
		if (!scrollRef.current) return;
		const sc = scrollRef.current;

		if (!centerBoundaryOnMount) {
			sc.scrollTop = 0;
			return;
		}

		if (!data?.length) return;

		const raf = requestAnimationFrame(() => {
			const tbody = sc.querySelector('tbody');
			if (!tbody) return;

			const buys = tbody.querySelectorAll<HTMLElement>('tr[data-type="buy"]');
			const sells = tbody.querySelectorAll<HTMLElement>('tr[data-type="sell"]');

			const lastBuy = buys.length ? buys[buys.length - 1] : null;
			const firstSell = sells.length ? sells[0] : null;

			const theadRow = sc.querySelector<HTMLElement>('thead tr');
			const stickyH = theadRow?.offsetHeight ?? 0;

			const centerOn = (y: number) => {
				const target = Math.max(0, y - (sc.clientHeight - stickyH) / 2);
				sc.scrollTop = target;
			};

			if (lastBuy && firstSell) {
				const mid = (lastBuy.offsetTop + firstSell.offsetTop) / 2;
				centerOn(mid);
			} else if (firstSell) {
				centerOn(firstSell.offsetTop);
			} else if (lastBuy) {
				centerOn(lastBuy.offsetTop);
			}
		});

		return () => cancelAnimationFrame(raf);
	}, [centerBoundaryOnMount, data?.length]);

	return (
		<div className={className}>
			{data.length > 0 ? (
				<div
					ref={scrollRef}
					className="orders-scroll"
					style={{ maxHeight: '100%', overflowY: 'auto' }}
				>
					<table
						className={tableClassName}
						style={{
							tableLayout:
								isMatch && responsive?.tableLayout
									? responsive.tableLayout
									: 'fixed',
							width: '100%',
							borderCollapse: 'separate',
							borderSpacing: 0,
						}}
					>
						<colgroup>
							{effectiveColumns.map((col) => (
								<col
									key={col.key}
									style={col.width ? { width: col.width } : undefined}
								/>
							))}
						</colgroup>

						<thead className={theadClassName}>
							<tr>
								{effectiveColumns.map((col) => (
									<th
										key={col.key}
										className={col.className}
										style={{
											position: 'sticky',
											top: '-1px',
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
							{grouped.map((group, gi) => (
								<React.Fragment key={group.key}>
									{renderGroupHeader && (
										<tr className="__group-header-row">
											<td colSpan={effectiveColumns.length}>
												{renderGroupHeader({
													groupKey: group.key,
													items: group.items,
													index: gi,
												})}
											</td>
										</tr>
									)}

									{group.items.map((row, i) => (
										<tr
											{...(getRowProps ? getRowProps(row, i) : {})}
											key={getRowKey(row, i)}
										>
											{effectiveColumns.map((col) => (
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
								</React.Fragment>
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
