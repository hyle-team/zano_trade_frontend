export type Align = 'left' | 'center' | 'right';

export type ColumnDef<T> = {
	key: string;
	header: React.ReactNode;
	width?: string;
	align?: Align;
	className?: string;
	cell: (_row: T, _rowIndex: number) => React.ReactNode;
};

export type RowProps = React.HTMLAttributes<HTMLTableRowElement> & {
	className?: string;
};

export type GroupHeaderRenderArgs<T> = {
	groupKey: string;
	items: T[];
	index: number;
};

export type GenericTableProps<T> = {
	className?: string;
	tableClassName?: string;
	theadClassName?: string;
	tbodyClassName?: string;
	columns: ColumnDef<T>[];
	data: T[];
	getRowKey: (_row: T, _rowIndex: number) => React.Key;
	emptyMessage?: string;
	getRowProps?: (_row: T, _index: number) => RowProps | undefined;
	groupBy?: (_row: T) => string | number;
	renderGroupHeader?: (_args: GroupHeaderRenderArgs<T>) => React.ReactNode;
	sortGroups?: (_a: string, _b: string) => number;
	responsive?: {
		query: string;
		hiddenKeys?: string[];
		alignOverride?: Record<string, 'left' | 'center' | 'right'>;
		tableLayout?: 'auto' | 'fixed';
	};
	centerBoundaryOnMount?: boolean;
};
