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
};
