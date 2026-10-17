import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';

import AssetSelectModal from '@/components/dex/swap/AssetSelectModal';
import SwapForm from '@/components/dex/swap/SwapForm';
import SwapOrderStatus from '@/components/dex/swap/SwapOrderStatus';
import { ArrowRightIcon } from '@/components/UI/Icons';
import { useSwapMarket } from '@/hook/useSwapMarket';
import { useKeepInView } from '@/hook/useKeepInView';
import { classes } from '@/utils/utils';
import { OrderSwapStage, formatTokenAmount, getOrderSwapState, safeDecimal } from '@/utils/swap';
import PairData from '@/interfaces/common/PairData';
import OfferType from '@/interfaces/common/OfferType';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import styles from './styles.module.scss';

interface SwapWidgetProps {
	initialPair: PairData | null;
	initialStats: PairStats | null;
	initialOrderBook: PageOrderData[];
}

const STAGE_LABELS: Record<OrderSwapStage, string | null> = {
	proposal: 'Accept',
	match: 'Match',
	requested: 'Pending',
	waiting: null,
};

const queryValue = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

const SwapWidget = ({ initialPair, initialStats, initialOrderBook }: SwapWidgetProps) => {
	const router = useRouter();

	const queryPair = queryValue(router.query.pair);
	const queryOrder = queryValue(router.query.order);

	const pairId = queryPair ?? (initialPair ? String(initialPair.id) : null);
	const orderId = queryOrder ?? null;
	const [side, setSide] = useState<OfferType>('buy');
	const [assetModalOpen, setAssetModalOpen] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);

	useKeepInView(cardRef);

	const market = useSwapMarket({
		pairId,
		initialPair,
		initialStats,
		initialOrderBook,
	});

	const { pairData, userOrders } = market;

	const updateQuery = (patch: Record<string, string | null>) => {
		const query: Record<string, string> = {};

		Object.entries({ ...router.query, ...patch }).forEach(([key, value]) => {
			if (key === 'side') return;
			const v = queryValue(value as string | string[] | undefined);
			if (v !== null && v !== undefined && v !== '') query[key] = v;
		});

		router.replace({ pathname: router.pathname, query }, undefined, {
			shallow: true,
			scroll: false,
		});
	};

	const openOrders = useMemo(
		() => [...userOrders].sort((a, b) => Number(b.timestamp) - Number(a.timestamp)).slice(0, 3),
		[userOrders],
	);

	const tokenTicker = pairData?.first_currency?.name || '';

	return (
		<>
			<div ref={cardRef} className={styles.card}>
				{orderId ? (
					<SwapOrderStatus
						orderId={orderId}
						pairData={pairData}
						userOrders={market.userOrders}
						applyTips={market.applyTips}
						pendings={market.pendings}
						orderBook={market.orderBook}
						userDataLoaded={market.userDataLoaded}
						onBack={() => updateQuery({ order: null })}
						onRefresh={market.refreshAll}
					/>
				) : (
					<SwapForm
						pairData={pairData}
						pairStats={market.pairStats}
						orderBook={market.orderBook}
						userOrders={market.userOrders}
						side={side}
						loading={market.pairLoading}
						onSideChange={setSide}
						onOpenAssetSelect={() => setAssetModalOpen(true)}
						onOrderCreated={(order) => {
							updateQuery({ order: String(order.id) });
							market.refreshAll();
						}}
					/>
				)}
			</div>

			{!orderId && openOrders.length > 0 && (
				<div className={styles.openOrders}>
					<p className={styles.openOrders__title}>
						Your open orders for {tokenTicker}
						<span>{userOrders.length}</span>
					</p>
					{openOrders.map((order) => {
						const { stage } = getOrderSwapState(
							order,
							market.applyTips,
							market.pendings,
						);
						const stageLabel = STAGE_LABELS[stage];

						return (
							<button
								key={order.id}
								className={styles.openOrders__row}
								onClick={() => updateQuery({ order: String(order.id) })}
							>
								<span
									className={classes(
										styles.openOrders__side,
										order.type === 'buy' ? styles.buy : styles.sell,
									)}
								>
									{order.type === 'buy' ? 'Buy' : 'Sell'}
								</span>
								<p>
									{formatTokenAmount(order.left, 6)} {tokenTicker}
									<span> @ {formatTokenAmount(order.price, 8)} ZANO</span>
								</p>
								{stageLabel && (
									<span className={styles.openOrders__badge}>{stageLabel}</span>
								)}
								{safeDecimal(order.left).lt(safeDecimal(order.amount)) && (
									<span className={styles.openOrders__partial}>Partial</span>
								)}
								<ArrowRightIcon className={styles.openOrders__arrow} />
							</button>
						);
					})}
				</div>
			)}

			<AssetSelectModal
				open={assetModalOpen}
				onClose={() => setAssetModalOpen(false)}
				selectedPairId={pairId}
				onSelect={(pair) => updateQuery({ pair: String(pair.id), order: null })}
			/>
		</>
	);
};

export default SwapWidget;
