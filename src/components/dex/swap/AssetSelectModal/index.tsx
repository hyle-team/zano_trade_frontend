import { useCallback, useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import Modal from '@/components/UI/Modal';
import TokenIcon from '@/components/UI/TokenIcon';
import { CheckIcon, SearchIcon } from '@/components/UI/Icons';
import { Switch } from '@/components/UI/Switch/Switch';
import { getQuotePairsPage } from '@/utils/methods';
import PairData from '@/interfaces/common/PairData';
import { classes, ZANO_ASSET_ID } from '@/utils/utils';
import { formatTokenAmount } from '@/utils/swap';
import Spinner from '@/components/UI/Spinner';
import Button from '@/components/UI/Button/Button';
import styles from './styles.module.scss';

interface AssetSelectModalProps {
	open: boolean;
	onClose: () => void;
	selectedPairId?: string | null;
	onSelect: (_pair: PairData, _rect?: DOMRect) => void;
}

const SEARCH_DEBOUNCE_MS = 300;
const SCROLL_END_OFFSET = 120;

const AssetSelectModal = ({ open, onClose, selectedPairId, onSelect }: AssetSelectModalProps) => {
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [whitelistedOnly, setWhitelistedOnly] = useState(true);
	const [pairs, setPairs] = useState<PairData[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const fetchIdRef = useRef('');
	const loadingRef = useRef(false);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const timeout = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timeout);
	}, [search]);

	const loadPage = useCallback(
		async (cursor: string | null) => {
			const fetchId = nanoid();
			fetchIdRef.current = fetchId;

			loadingRef.current = true;
			setLoading(true);

			const pageRes = await getQuotePairsPage(
				ZANO_ASSET_ID,
				cursor,
				debouncedSearch,
				whitelistedOnly,
			).catch(() => null);

			if (fetchIdRef.current !== fetchId) return;

			if (pageRes?.success) {
				setPairs((prev) =>
					cursor === null
						? pageRes.data
						: [
								...prev,
								...pageRes.data.filter((p) => !prev.some((e) => e.id === p.id)),
							],
				);
				setNextCursor(pageRes.nextCursor);
			} else {
				if (cursor === null) setPairs([]);
				setNextCursor(null);
			}

			loadingRef.current = false;
			setLoading(false);
		},
		[debouncedSearch, whitelistedOnly],
	);

	useEffect(() => {
		if (!open) return;

		listRef.current?.scrollTo({ top: 0 });
		setPairs([]);
		setNextCursor(null);
		loadPage(null);
	}, [open, loadPage]);

	const hasMore = nextCursor !== null;

	const loadMore = () => {
		if (!loadingRef.current && hasMore) loadPage(nextCursor);
	};

	const onListScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const list = e.currentTarget;
		if (list.scrollTop + list.clientHeight >= list.scrollHeight - SCROLL_END_OFFSET) loadMore();
	};

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

			<div ref={listRef} className={styles.list} onScroll={onListScroll}>
				{pairs.map((pair) => {
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

				{!loading && hasMore && (
					<Button
						variant="ghost"
						size="sm"
						className={styles.loadMore}
						onClick={loadMore}
					>
						Load more
					</Button>
				)}
			</div>
		</Modal>
	);
};

export default AssetSelectModal;
