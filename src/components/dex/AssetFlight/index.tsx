import { CSSProperties, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Decimal from 'decimal.js';
import PairChip, { PAIR_CHIP_WIDTH } from '@/components/dex/PairChip';
import { Store } from '@/store/store-reducer';
import { figtree } from '@/utils/font';
import { classes } from '@/utils/utils';
import PairData from '@/interfaces/common/PairData';
import styles from './styles.module.scss';

interface AssetFlightProps {
	pair: PairData;
	from: DOMRect;
	onDone: () => void;
}

const FLIGHT_MS = 550;
const TARGET_TOP = 84;

function getSidePadding(width: number) {
	if (width > 1600) return 60;
	if (width > 1200) return 40;
	return 20;
}

const AssetFlight = ({ pair, from, onDone }: AssetFlightProps) => {
	const { state } = useContext(Store);
	const [flying, setFlying] = useState(false);

	useEffect(() => {
		const frame = requestAnimationFrame(() => requestAnimationFrame(() => setFlying(true)));
		const timeout = setTimeout(onDone, FLIGHT_MS + 50);

		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(timeout);
		};
	}, []);

	const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth;
	const side = getSidePadding(viewportWidth);
	const targetWidth = Math.min(PAIR_CHIP_WIDTH, viewportWidth - side * 2);

	const zanoUsd = state.assetsRates.get(pair.second_currency?.asset_id || '');
	const rateUsd =
		pair.rate !== undefined && zanoUsd !== undefined
			? new Decimal(pair.rate).mul(zanoUsd).toFixed(2)
			: null;

	const style: CSSProperties = flying
		? { top: TARGET_TOP, left: side, width: targetWidth }
		: { top: from.top, left: from.left, width: from.width };

	return createPortal(
		<div className={classes(styles.flight, figtree.variable, flying && styles.flight__active)}>
			<div className={styles.flight__card} style={style}>
				<PairChip
					pair={pair}
					rate={pair.rate}
					rateUsd={rateUsd}
					change={pair.coefficient}
					className={styles.flight__chip}
				/>
			</div>
		</div>,
		document.body,
	);
};

export default AssetFlight;
