import { useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { useInView } from 'react-intersection-observer';
import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import Preloader from '@/components/UI/Preloader/Preloader';
import PairsTable from '@/components/default/PairsTable/PairsTable';
import DexHeader from '@/pages/dex/DexHeader/DexHeader';
import PairsList from '@/pages/dex/pairs/PairsList/PairsList';
import { getPairsPage, getPairsPagesAmount } from '@/utils/methods';
import PairData from '@/interfaces/common/PairData';
import { PairSortOption } from '@/interfaces/enum/pair';
import styles from '@/styles/Dex.module.scss';

interface MarketsListProps {
	initialPairs: PairData[];
	initialZanoUsd: number | null;
}

function MarketsList({ initialPairs, initialZanoUsd }: MarketsListProps) {
	const fetchIdRef = useRef<string>(nanoid());
	const bottomInView = useRef<boolean>(false);
	const isFirstLoad = useRef(true);

	const [pairInputState, setPairInputState] = useState('');
	const [pairs, setPairs] = useState<PairData[]>(initialPairs);
	const [allLoaded, setLoadedState] = useState(initialPairs.length > 0);
	const [pagesAmount, setPagesAmount] = useState<number>();
	const [pageLoading, setPageLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [whitelistedOnly, setWhitelistedOnly] = useState(true);
	const [shouldUpdatePairSearch, setShouldUpdatePairSearch] = useState(true);
	const [sortOption, setSortOption] = useState<PairSortOption>(PairSortOption.VOLUME_HIGH_TO_LOW);

	const { ref: inViewRef, inView } = useInView({
		threshold: 0,
	});

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const currentState = localStorage.getItem('all_pairs') ?? '';

			if (currentState === '' || currentState === 'true') {
				setWhitelistedOnly(true);
				return;
			}

			if (currentState === 'false') {
				setWhitelistedOnly(false);
			}
		}
	}, []);

	useEffect(() => {
		if (!shouldUpdatePairSearch) return;
		getPairsPagesAmount(pairInputState, whitelistedOnly)
			.then((result) => {
				if (!result.success) throw new Error('Error fetch pages amount');
				setPagesAmount(result.data);
			})
			.catch((e) => {
				console.error(e);
				setPagesAmount((prev) => prev && 1);
			});
	}, [pairInputState, whitelistedOnly, shouldUpdatePairSearch]);

	async function fetchPairs() {
		const initial = currentPage === 1;

		if (initial && initialPairs.length > 0 && isFirstLoad.current) {
			isFirstLoad.current = false;
			return;
		}

		setPageLoading(!initial);
		const newFetchId = nanoid();
		fetchIdRef.current = newFetchId;
		const result = await getPairsPage(currentPage, pairInputState, whitelistedOnly, sortOption);

		const fetchId = fetchIdRef.current;
		if (fetchId !== newFetchId) return;
		if (!result.success) {
			setPageLoading(false);
			return;
		}

		if (initial) {
			setPairs(result.data);
		} else {
			setPairs((prev) => [
				...prev,
				...result.data.filter((e) => !prev.some((prevEl) => prevEl.id === e.id)),
			]);
		}

		if (initial) {
			setLoadedState(true);
		} else {
			setPageLoading(false);
		}

		if (bottomInView.current && pagesAmount && currentPage < pagesAmount) {
			setCurrentPage((prev) => prev + 1);
		}
	}

	useEffect(() => {
		fetchPairs();
	}, [currentPage, pairInputState, whitelistedOnly, pagesAmount, sortOption]);

	useEffect(() => {
		if (inView && allLoaded && !pageLoading && pagesAmount && currentPage < pagesAmount) {
			setCurrentPage((prev) => prev + 1);
		}
	}, [inView, allLoaded, pageLoading, pagesAmount, currentPage]);

	return (
		<div className={styles.main}>
			<div className={styles.dex__charts__wrapper}>
				<DexHeader
					pairInputState={pairInputState}
					setCurrentPage={setCurrentPage}
					setLoadedState={setLoadedState}
					setPairInputState={setPairInputState}
					setPairs={setPairs}
					setShouldUpdatePairSearch={setShouldUpdatePairSearch}
					setWhitelistedOnly={setWhitelistedOnly}
					whitelistedOnly={whitelistedOnly}
					setSortOption={setSortOption}
					sortOption={sortOption}
					fetchPairs={fetchPairs}
				/>
				{allLoaded ? (
					<>
						<PairsTable data={pairs} initialZanoUsd={initialZanoUsd} />
						<PairsList data={pairs} initialZanoUsd={initialZanoUsd} />
					</>
				) : (
					<ContentPreloader className={styles.dex__preloader} />
				)}
				<div ref={inViewRef}>{pageLoading && <Preloader />}</div>
			</div>
		</div>
	);
}

export default MarketsList;
