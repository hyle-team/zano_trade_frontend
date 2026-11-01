import { useEffect, useState } from 'react';
import { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import Header from '@/components/default/Header/Header';
import SiteFooter from '@/components/default/SiteFooter';
import ModeSwitch from '@/components/dex/swap/ModeSwitch';
import SwapWidget from '@/components/dex/swap/SwapWidget';
import HowItWorks from '@/components/dex/swap/HowItWorks';
import FeaturedPairs from '@/components/dex/swap/FeaturedPairs';
import AssetSelectModal from '@/components/dex/swap/AssetSelectModal';
import AssetFlight from '@/components/dex/AssetFlight';
import { ListIcon } from '@/components/UI/Icons';
import Button from '@/components/UI/Button/Button';
import {
	findPairID,
	getFeaturedPairs,
	getOrdersPage,
	getPair,
	getPairStats,
} from '@/utils/serverMethods';
import { getForwardedFor } from '@/utils/serverFetch';
import { classes, ZANO_ASSET_ID } from '@/utils/utils';
import { figtree } from '@/utils/font';
import { SwapMode } from '@/utils/swap';
import { setStoredDexMode } from '@/utils/dexMode';
import PairData from '@/interfaces/common/PairData';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import styles from '@/styles/Dex.module.scss';

interface DexProps {
	initialPair: PairData | null;
	initialStats: PairStats | null;
	initialOrderBook: PageOrderData[];
	featuredPairs: PairData[];
}

const FEATURED_PAIRS_COUNT = 3;

const queryValue = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

function Dex({ initialPair, initialStats, initialOrderBook, featuredPairs }: DexProps) {
	const router = useRouter();
	const [assetPickerOpen, setAssetPickerOpen] = useState(false);
	const [flight, setFlight] = useState<{ pair: PairData; rect: DOMRect } | null>(null);

	const currentPairId =
		queryValue(router.query.pair) ?? (initialPair ? String(initialPair.id) : null);
	const [expanded, setExpanded] = useState(false);

	const openAdvanced = (pairId: string | number) => {
		setStoredDexMode('advanced');
		router.push(`/dex/trading/${pairId}`);
	};

	const onModeChange = (next: SwapMode) => {
		if (next !== 'advanced') return;

		if (currentPairId) {
			openAdvanced(currentPairId);
			return;
		}

		setAssetPickerOpen(true);
	};

	const selectFeaturedPair = (pair: PairData) => {
		router.replace({ pathname: router.pathname, query: { pair: String(pair.id) } }, undefined, {
			shallow: true,
			scroll: false,
		});
	};

	useEffect(() => {
		if (!router.isReady || queryValue(router.query.mode) !== 'advanced') return;

		const query = { ...router.query };
		delete query.mode;
		router.replace({ pathname: router.pathname, query }, undefined, {
			shallow: true,
			scroll: false,
		});

		if (currentPairId) {
			openAdvanced(currentPairId);
		} else {
			setAssetPickerOpen(true);
		}
	}, [router.isReady, router.query.mode]);

	return (
		<>
			<Header />
			<main className={classes(styles.swapPage, figtree.variable)}>
				<div
					className={classes(
						styles.swapPage__top,
						expanded && styles.swapPage__top_expanded,
					)}
				>
					<section className={styles.swapPage__hero}>
						<h1 className={styles.swapPage__title}>
							Swap <span>Zano assets</span>
						</h1>
						<p className={styles.swapPage__subtitle}>
							Peer-to-peer ionic swaps with ZANO. Non-custodial, settled directly
							between wallets.
						</p>

						<div className={styles.swapPage__actions}>
							<ModeSwitch mode="standard" onChange={onModeChange} />
							<Button
								variant="secondary"
								size="sm"
								className={styles.swapPage__ordersLink}
								onClick={() => router.push('/dex/orders')}
								aria-label="My orders"
							>
								<ListIcon />
								<span className={styles.swapPage__ordersText}>My orders</span>
							</Button>
						</div>
					</section>

					<div className={styles.swapPage__widget}>
						<SwapWidget
							initialPair={initialPair}
							initialStats={initialStats}
							initialOrderBook={initialOrderBook}
							onExpandedChange={setExpanded}
						/>
					</div>

					{featuredPairs.length > 0 && !expanded && (
						<div className={styles.swapPage__featured}>
							<FeaturedPairs
								pairs={featuredPairs}
								selectedPairId={currentPairId}
								onSelect={selectFeaturedPair}
							/>
						</div>
					)}
				</div>

				<div className={styles.swapPage__content}>
					<HowItWorks />
				</div>
			</main>

			<SiteFooter />

			<AssetSelectModal
				open={assetPickerOpen}
				onClose={() => setAssetPickerOpen(false)}
				onSelect={(pair, rect) => {
					router.prefetch(`/dex/trading/${pair.id}`);

					if (rect) {
						setFlight({ pair, rect });
					} else {
						openAdvanced(pair.id);
					}
				}}
			/>

			{flight && (
				<AssetFlight
					pair={flight.pair}
					from={flight.rect}
					onDone={() => openAdvanced(flight.pair.id)}
				/>
			)}
		</>
	);
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	const xForwardedFor = getForwardedFor(ctx.req);
	const { pair, asset } = ctx.query;

	let pairId: string | null = typeof pair === 'string' && pair ? pair : null;

	if (!pairId && typeof asset === 'string' && asset) {
		const found = await findPairID(asset, ZANO_ASSET_ID, { xForwardedFor }).catch(
			() => undefined,
		);
		if (found) pairId = String(found);
	}

	const featuredRes = await getFeaturedPairs(FEATURED_PAIRS_COUNT, { xForwardedFor }).catch(
		() => null,
	);
	const featuredPairs = (featuredRes?.success ? featuredRes.data : []).filter(
		(p) => p.second_currency?.asset_id === ZANO_ASSET_ID,
	);

	const [pairRes, statsRes, ordersRes] = pairId
		? await Promise.all([
				getPair(pairId, { xForwardedFor }).catch(() => null),
				getPairStats(pairId, { xForwardedFor }).catch(() => null),
				getOrdersPage(pairId, { xForwardedFor }).catch(() => null),
			])
		: [null, null, null];

	return {
		props: {
			initialPair: pairRes?.success ? pairRes.data : null,
			initialStats: statsRes?.success ? statsRes.data : null,
			initialOrderBook: ordersRes?.success ? ordersRes.data : [],
			featuredPairs,
		},
	};
}

export default Dex;
