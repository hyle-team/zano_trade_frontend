import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { classes } from '@/utils/utils';
import { CheckIcon, ChevronDownIcon, SearchIcon } from '@/components/UI/Icons';
import styles from './styles.module.scss';

export interface SelectOption<T extends string> {
	value: T;
	label: string;
	icon?: ReactNode;
	searchText?: string;
}

interface SelectProps<T extends string> {
	options: SelectOption<T>[];
	value: T;
	onChange: (_value: T) => void;
	searchable?: boolean;
	searchPlaceholder?: string;
	emptyText?: string;
	className?: string;
}

function Select<T extends string>({
	options,
	value,
	onChange,
	searchable,
	searchPlaceholder = 'Search',
	emptyText = 'Nothing found',
	className,
}: SelectProps<T>) {
	const ref = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [alignEnd, setAlignEnd] = useState(false);

	useEffect(() => {
		if (!open) return;

		const onMouseDown = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};

		document.addEventListener('mousedown', onMouseDown);
		document.addEventListener('keydown', onKeyDown);
		searchRef.current?.focus();

		return () => {
			document.removeEventListener('mousedown', onMouseDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [open]);

	useEffect(() => {
		if (!open) setSearch('');
	}, [open]);

	const selected = options.find((o) => o.value === value) ?? options[0];

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return options;
		return options.filter((o) =>
			`${o.label} ${o.searchText ?? ''}`.toLowerCase().includes(query),
		);
	}, [options, search]);

	return (
		<div ref={ref} className={classes(styles.select, open && styles.active, className)}>
			<button
				type="button"
				className={styles.select__trigger}
				onClick={() => {
					const dropdown = ref.current?.querySelector<HTMLElement>(
						`.${styles.select__dropdown}`,
					);
					const rect = ref.current?.getBoundingClientRect();

					if (rect && dropdown) {
						setAlignEnd(rect.left + dropdown.offsetWidth > window.innerWidth - 16);
					}

					setOpen((prev) => !prev);
				}}
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				<span className={styles.select__value}>
					{selected?.icon}
					{selected?.label}
				</span>
				<ChevronDownIcon className={styles.select__chevron} />
			</button>

			<div
				className={classes(
					styles.select__dropdown,
					alignEnd && styles.select__dropdown_end,
				)}
				role="listbox"
			>
				{searchable && (
					<label className={styles.select__search}>
						<SearchIcon width={16} height={16} />
						<input
							ref={searchRef}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={searchPlaceholder}
						/>
					</label>
				)}

				<div className={styles.select__list}>
					{filtered.map((option) => (
						<button
							type="button"
							role="option"
							aria-selected={option.value === value}
							key={option.value}
							className={styles.item}
							onClick={() => {
								onChange(option.value);
								setOpen(false);
							}}
						>
							<span className={styles.item__content}>
								{option.icon}
								<span>{option.label}</span>
							</span>
							{option.value === value && <CheckIcon className={styles.item__check} />}
						</button>
					))}

					{!filtered.length && <p className={styles.select__empty}>{emptyText}</p>}
				</div>
			</div>
		</div>
	);
}

export default Select;
