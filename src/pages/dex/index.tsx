import { useEffect, useState } from 'react';
import { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import Header from '@/components/default/Header/Header';
import SiteFooter from '@/components/default/SiteFooter';
import ModeSwitch from '@/components/dex/swap/ModeSwitch';
import SwapWidget from '@/components/dex/swap/SwapWidget';
import HowItWorks from '@/components/dex/swap/HowItWorks';
import MarketsList from '@/components/dex/MarketsList';
import { ListIcon } from '@/components/UI/Icons';
import Button from '@/components/UI/Button/Button';
import {
	findPairID,
	getOrdersPage,
	getPair,
	getPairStats,
	getPairsPage,
} from '@/utils/serverMethods';
import { getForwardedFor } from '@/utils/serverFetch';
import { getZanoPrice } from '@/utils/methods';
import { classes, ZANO_ASSET_ID } from '@/utils/utils';
import { figtree } from '@/utils/font';
import { SwapMode } from '@/utils/swap';
import { DEX_MODE_COOKIE, parseDexMode } from '@/utils/dexMode';
import { PairSortOption } from '@/interfaces/enum/pair';
import PairData from '@/interfaces/common/PairData';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import styles from '@/styles/Dex.module.scss';

interface DexProps {
	initialPair: PairData | null;
	initialStats: PairStats | null;
	initialOrderBook: PageOrderData[];
	initialPairs: PairData[];
	initialZanoUsd: number | null;
	initialMode: SwapMode;
}

const HERO: Record<SwapMode, { title: string; accent: string; subtitle: string }> = {
	standard: {
		title: 'Swap',
		accent: 'Zano assets',
		subtitle:
			'Peer-to-peer ionic swaps with ZANO. Non-custodial, settled directly between wallets.',
	},
	advanced: {
		title: 'Decentralized',
		accent: 'Exchange',
		subtitle:
			'Order books and charts for every Zano asset. Peer-to-peer trading with ionic swaps.',
	},
};

function Dex({
	initialPair,
	initialStats,
	initialOrderBook,
	initialPairs,
	initialZanoUsd,
	initialMode,
}: DexProps) {
	const router = useRouter();
	const [mode, setMode] = useState<SwapMode>(initialMode);
	const queryMode = parseDexMode(router.query.mode);

	useEffect(() => {
		if (queryMode) setMode(queryMode);
	}, [queryMode]);
	const hero = HERO[mode];

	return (
		<>
			<Header />
			<main className={classes(styles.swapPage, figtree.variable)}>
				<section className={styles.swapPage__hero}>
					<h1 key={`title-${mode}`} className={styles.swapPage__title}>
						{hero.title} <span>{hero.accent}</span>
					</h1>
					<p key={`subtitle-${mode}`} className={styles.swapPage__subtitle}>
						{hero.subtitle}
					</p>

					<div className={styles.swapPage__actions}>
						<ModeSwitch mode={mode} onChange={setMode} />
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

				<div key={mode} className={styles.swapPage__content}>
					{mode === 'standard' ? (
						<>
							<div className={styles.swapPage__widget}>
								<SwapWidget
									initialPair={initialPair}
									initialStats={initialStats}
									initialOrderBook={initialOrderBook}
								/>
							</div>

							<HowItWorks />
						</>
					) : (
						<div className={styles.swapPage__markets}>
							<MarketsList
								initialPairs={initialPairs}
								initialZanoUsd={initialZanoUsd}
							/>
						</div>
					)}
				</div>
			</main>

			<SiteFooter />
		</>
	);
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	const xForwardedFor = getForwardedFor(ctx.req);
	const { pair, asset } = ctx.query;
	const initialMode =
		parseDexMode(ctx.query.mode) ??
		parseDexMode(ctx.req.cookies?.[DEX_MODE_COOKIE]) ??
		'standard';

	const [pairsRes, priceRes] = await Promise.all([
		getPairsPage(1, '', true, PairSortOption.VOLUME_HIGH_TO_LOW, { xForwardedFor }).catch(
			() => null,
		),
		getZanoPrice().catch(() => null),
	]);

	const initialPairs = pairsRes?.success ? pairsRes.data : [];
	const initialZanoUsd =
		priceRes?.success && typeof priceRes.data?.usd === 'number' ? priceRes.data.usd : null;

	let pairId: string | null = typeof pair === 'string' && pair ? pair : null;

	if (!pairId && typeof asset === 'string' && asset) {
		const found = await findPairID(asset, ZANO_ASSET_ID, { xForwardedFor }).catch(
			() => undefined,
		);
		if (found) pairId = String(found);
	}

	if (!pairId) {
		const defaultPair = initialPairs.find((p) => p.second_currency?.asset_id === ZANO_ASSET_ID);
		pairId = defaultPair ? String(defaultPair.id) : null;
	}

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
			initialPairs,
			initialZanoUsd,
			initialMode,
		},
	};
}

export default Dex;
