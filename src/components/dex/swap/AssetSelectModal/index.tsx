import { useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import Modal from '@/components/UI/Modal';
import TokenIcon from '@/components/UI/TokenIcon';
import { CheckIcon, SearchIcon } from '@/components/UI/Icons';
import { Switch } from '@/components/UI/Switch/Switch';
import { getPairsPage, getPairsPagesAmount } from '@/utils/methods';
import { PairSortOption } from '@/interfaces/enum/pair';
import PairData from '@/interfaces/common/PairData';
import { classes, ZANO_ASSET_ID } from '@/utils/utils';
import { formatTokenAmount } from '@/utils/swap';
import Spinner from '@/components/UI/Spinner';
import styles from './styles.module.scss';

interface AssetSelectModalProps {
	open: boolean;
	onClose: () => void;
	selectedPairId?: string | null;
	onSelect: (_pair: PairData, _rect?: DOMRect) => void;
}

const SEARCH_DEBOUNCE_MS = 300;
const VISIBLE_STEP = 10;

const AssetSelectModal = ({ open, onClose, selectedPairId, onSelect }: AssetSelectModalProps) => {
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [whitelistedOnly, setWhitelistedOnly] = useState(true);
	const [pairs, setPairs] = useState<PairData[]>([]);
	const [page, setPage] = useState(1);
	const [pagesAmount, setPagesAmount] = useState(1);
	const [loading, setLoading] = useState(false);
	const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP);
	const fetchIdRef = useRef('');
	const listRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const timeout = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timeout);
	}, [search]);

	useEffect(() => {
		setPage(1);
		setVisibleCount(VISIBLE_STEP);
		listRef.current?.scrollTo({ top: 0 });
	}, [debouncedSearch, whitelistedOnly]);

	useEffect(() => {
		if (!open) setVisibleCount(VISIBLE_STEP);
	}, [open]);

	useEffect(() => {
		if (!open) return;

		const fetchId = nanoid();
		fetchIdRef.current = fetchId;

		(async () => {
			setLoading(true);

			const [pageRes, amountRes] = await Promise.all([
				getPairsPage(
					page,
					debouncedSearch,
					whitelistedOnly,
					PairSortOption.VOLUME_HIGH_TO_LOW,
				).catch(() => null),
				page === 1
					? getPairsPagesAmount(debouncedSearch, whitelistedOnly).catch(() => null)
					: Promise.resolve(null),
			]);

			if (fetchIdRef.current !== fetchId) return;

			if (amountRes?.success) setPagesAmount(amountRes.data);

			if (pageRes?.success) {
				const zanoPairs = pageRes.data.filter(
					(pair) => pair.second_currency?.asset_id === ZANO_ASSET_ID,
				);

				setPairs((prev) =>
					page === 1
						? zanoPairs
						: [...prev, ...zanoPairs.filter((p) => !prev.some((e) => e.id === p.id))],
				);
			} else if (page === 1) {
				setPairs([]);
			}

			setLoading(false);
		})();
	}, [open, page, debouncedSearch, whitelistedOnly]);

	const hasMore = page < pagesAmount;
	const canShowMore = pairs.length > visibleCount || hasMore;

	useEffect(() => {
		if (open && !loading && hasMore && pairs.length < visibleCount) {
			setPage((p) => p + 1);
		}
	}, [open, loading, hasMore, pairs.length, visibleCount]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!open || !sentinel || !canShowMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setVisibleCount((count) => count + VISIBLE_STEP);
				}
			},
			{ root: listRef.current, rootMargin: '0px 0px 120px 0px' },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [open, canShowMore, pairs.length, visibleCount]);

	return (
		<Modal open={open} onClose={onClose} title="Select asset">
			<div className={styles.controls}>
				<label className={styles.search}>
					<SearchIcon />
					<input
						autoFocus
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by ticker or asset ID"
					/>
				</label>

				<div
					className={styles.toggle}
					role="button"
					tabIndex={-1}
					onClick={() => setWhitelistedOnly((value) => !value)}
				>
					<p>Show all assets</p>
					<Switch checked={!whitelistedOnly} onChange={() => undefined} />
				</div>
			</div>

			<div ref={listRef} className={styles.list}>
				{pairs.slice(0, visibleCount).map((pair) => {
					const selected = String(pair.id) === String(selectedPairId);
					const change = Number(pair.coefficient || 0);

					return (
						<button
							key={pair.id}
							className={classes(styles.row, selected && styles.selected)}
							onClick={(e) => {
								onSelect(pair, e.currentTarget.getBoundingClientRect());
								onClose();
							}}
						>
							<TokenIcon assetId={pair.first_currency?.asset_id} size={36} />

							<div className={styles.row__info}>
								<p className={styles.row__ticker}>
									{pair.first_currency?.name}
									{pair.featured && (
										<span
											className={classes(
												styles.row__badge,
												styles.row__badge_featured,
											)}
										>
											Featured
										</span>
									)}
									{pair.whitelisted ? (
										<span
											className={classes(
												styles.row__badge,
												styles.row__badge_whitelisted,
											)}
										>
											Whitelisted
										</span>
									) : (
										<span className={styles.row__badge}>Unverified</span>
									)}
								</p>
								<p className={styles.row__name}>
									{pair.first_currency?.asset_info?.full_name || 'Zano asset'}
								</p>
							</div>

							<div className={styles.row__price}>
								<p>
									{formatTokenAmount(pair.rate || 0, 6)} <span>ZANO</span>
								</p>
								<p
									className={classes(
										styles.row__change,
										change > 0 && styles.up,
										change < 0 && styles.down,
									)}
								>
									{change > 0 ? '+' : ''}
									{change.toFixed(2)}%
								</p>
							</div>

							{selected && <CheckIcon className={styles.row__check} />}
						</button>
					);
				})}

				{!loading && pairs.length === 0 && (
					<div className={styles.empty}>
						<span className={styles.empty__icon}>
							<SearchIcon width={22} height={22} />
						</span>
						<p className={styles.empty__title}>No assets found</p>
						<p className={styles.empty__text}>Try another ticker or asset ID.</p>
					</div>
				)}

				{loading && (
					<div className={styles.loader}>
						<Spinner />
					</div>
				)}

				{!loading && canShowMore && <div ref={sentinelRef} className={styles.sentinel} />}
			</div>
		</Modal>
	);
};

export default AssetSelectModal;
