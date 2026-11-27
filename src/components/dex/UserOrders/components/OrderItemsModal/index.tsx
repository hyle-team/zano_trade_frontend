import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '@/components/UI/Modal';
import Spinner from '@/components/UI/Spinner';
import EmptyMessage from '@/components/UI/EmptyMessage';
import GenericTable from '@/components/default/GenericTable';
import { Store } from '@/store/store-reducer';
import { useMediaQuery } from '@/hook/useMediaQuery';
import {
	getOrderIncomingProposalsPage,
	getOrderMatchesPage,
	getOrderOutgoingProposalsPage,
} from '@/utils/methods';
import { CursorPage } from '@/utils/v2/client';
import ErrorRes from '@/interfaces/responses/ErrorRes';
import ApplyTip from '@/interfaces/common/ApplyTip';
import UserPendingType from '@/interfaces/common/UserPendingType';
import { buildApplyTipsColumns, buildMyRequestsColumns } from '../../columns';
import UniversalCards from '../../cards/UniversalCards';
import OrderGroupHeader from '../OrderGroupHeader';
import { OrderItemsKind, OrderItemsModalProps } from './types';
import styles from './styles.module.scss';

type PageFetcher<T> = (
	_cursor: string | null,
) => Promise<ErrorRes | { success: true; data: CursorPage<T> }>;

const TITLES: Record<OrderItemsKind, string> = {
	matches: 'Matches',
	requests: 'Requests',
	offers: 'Offers',
};

const COUNT_FIELDS: Record<
	OrderItemsKind,
	'matches_count' | 'incoming_proposals_count' | 'outgoing_proposals_count'
> = {
	matches: 'matches_count',
	requests: 'incoming_proposals_count',
	offers: 'outgoing_proposals_count',
};

const EMPTY_TEXTS: Record<OrderItemsKind, string> = {
	matches: 'No matches',
	requests: 'No requests',
	offers: 'No offers',
};

function useCursorPages<T>(fetchPage: PageFetcher<T> | null) {
	const [items, setItems] = useState<T[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const requestIdRef = useRef(0);

	const load = useCallback(
		async (cursor: string | null) => {
			if (!fetchPage) return;

			requestIdRef.current += 1;
			const requestId = requestIdRef.current;

			setLoading(true);
			const result = await fetchPage(cursor).catch(() => null);
			if (requestId !== requestIdRef.current) return;

			setLoading(false);
			if (!result?.success) return;

			setItems((prev) =>
				cursor === null ? result.data.items : [...prev, ...result.data.items],
			);
			setNextCursor(result.data.nextCursor);
			setLoaded(true);
		},
		[fetchPage],
	);

	useEffect(() => {
		setItems([]);
		setNextCursor(null);
		setLoaded(false);
		load(null);
	}, [load]);

	return {
		items,
		loading,
		loaded,
		hasMore: nextCursor !== null,
		loadMore: () => load(nextCursor),
		reload: () => load(null),
	};
}

const OrderItemsModal = ({
	kind,
	order,
	pairData,
	firstCurrencyName,
	secondCurrencyName,
	secondAssetUsdPrice,
	matrixAddresses,
	onClose,
	onAfter,
	onCountsOutdated,
}: OrderItemsModalProps) => {
	const { state } = useContext(Store);
	const isSm = useMediaQuery('(max-width: 820px)');
	const listRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	const tipsFetcher = useMemo<PageFetcher<ApplyTip> | null>(() => {
		if (!order || (kind !== 'matches' && kind !== 'requests')) return null;

		const auth = { token: state.token };

		return kind === 'matches'
			? (cursor) => getOrderMatchesPage(order, cursor, auth)
			: (cursor) => getOrderIncomingProposalsPage(order, cursor, auth);
	}, [kind, order, state.token]);

	const pendingsFetcher = useMemo<PageFetcher<UserPendingType> | null>(() => {
		if (!order || kind !== 'offers') return null;

		return (cursor) => getOrderOutgoingProposalsPage(order, cursor, { token: state.token });
	}, [kind, order, state.token]);

	const tips = useCursorPages(tipsFetcher);
	const pendings = useCursorPages(pendingsFetcher);
	const list = kind === 'offers' ? pendings : tips;

	const countsCheckedRef = useRef(false);

	useEffect(() => {
		if (!kind || !order || !list.loaded || list.loading || list.hasMore) return;
		if (countsCheckedRef.current) return;

		countsCheckedRef.current = true;
		if (list.items.length !== (order[COUNT_FIELDS[kind]] ?? 0)) onCountsOutdated();
	}, [kind, order, list.loaded, list.loading, list.hasMore, list.items.length, onCountsOutdated]);

	const reloadRef = useRef(list.reload);
	reloadRef.current = list.reload;

	const onAfterAction = useCallback(async () => {
		await onAfter();
		reloadRef.current();
	}, [onAfter]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!kind || !sentinel || !list.hasMore || list.loading) return undefined;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) list.loadMore();
			},
			{ root: listRef.current, rootMargin: '0px 0px 120px 0px' },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [kind, list.hasMore, list.loading, list.items.length]);

	const connectedOrders = useMemo(() => (order ? [order] : []), [order]);

	const tipsColumns = useMemo(
		() =>
			buildApplyTipsColumns({
				type: kind === 'requests' ? 'offers' : 'suitables',
				firstCurrencyName,
				secondCurrencyName,
				matrixAddresses,
				secondAssetUsdPrice,
				userOrders: connectedOrders,
				pairData,
				onAfter: onAfterAction,
			}),
		[
			kind,
			firstCurrencyName,
			secondCurrencyName,
			matrixAddresses,
			secondAssetUsdPrice,
			connectedOrders,
			pairData,
			onAfterAction,
		],
	);

	const pendingsColumns = useMemo(
		() =>
			buildMyRequestsColumns({
				firstCurrencyName,
				secondCurrencyName,
				secondAssetUsdPrice,
				matrixAddresses,
				onAfter: onAfterAction,
			}),
		[
			firstCurrencyName,
			secondCurrencyName,
			secondAssetUsdPrice,
			matrixAddresses,
			onAfterAction,
		],
	);

	if (!kind || !order) return null;

	const renderItems = () => {
		if (!list.items.length) {
			return list.loading ? null : <EmptyMessage text={EMPTY_TEXTS[kind]} />;
		}

		if (kind === 'offers') {
			return isSm ? (
				<UniversalCards
					type="requests"
					data={pendings.items}
					firstCurrencyName={firstCurrencyName}
					secondCurrencyName={secondCurrencyName}
					secondAssetUsdPrice={secondAssetUsdPrice}
					matrixAddresses={matrixAddresses}
					onAfter={onAfterAction}
				/>
			) : (
				<GenericTable
					columns={pendingsColumns}
					data={pendings.items}
					getRowKey={(row) => row.id}
				/>
			);
		}

		return isSm ? (
			<UniversalCards
				type={kind === 'requests' ? 'offers' : 'matches'}
				data={tips.items}
				firstCurrencyName={firstCurrencyName}
				secondCurrencyName={secondCurrencyName}
				secondAssetUsdPrice={secondAssetUsdPrice}
				matrixAddresses={matrixAddresses}
				pairData={pairData}
				userOrders={connectedOrders}
				onAfter={onAfterAction}
			/>
		) : (
			<GenericTable columns={tipsColumns} data={tips.items} getRowKey={(row) => row.id} />
		);
	};

	return (
		<Modal open onClose={onClose} title={TITLES[kind]} className={styles.modal}>
			<div className={styles.order}>
				<OrderGroupHeader
					order={order}
					firstCurrencyName={firstCurrencyName}
					secondCurrencyName={secondCurrencyName}
				/>
			</div>

			<div ref={listRef} className={styles.list}>
				{renderItems()}

				{list.loading && (
					<div className={styles.loader}>
						<Spinner />
					</div>
				)}

				{list.hasMore && !list.loading && (
					<div ref={sentinelRef} className={styles.sentinel} />
				)}
			</div>
		</Modal>
	);
};

export default OrderItemsModal;
