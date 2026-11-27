import { CSSProperties } from 'react';
import TokenIcon from '@/components/UI/TokenIcon';
import { ChevronDownIcon } from '@/components/UI/Icons';
import { classes } from '@/utils/utils';
import { formatTokenAmount } from '@/utils/swap';
import PairData from '@/interfaces/common/PairData';
import styles from './styles.module.scss';

interface PairChipProps {
	pair: PairData | null;
	rate?: number | string | null;
	rateUsd?: string | null;
	change?: number | null;
	onClick?: () => void;
	className?: string;
	style?: CSSProperties;
}

export const PAIR_CHIP_WIDTH = 300;

const PairChip = ({ pair, rate, rateUsd, change, onClick, className, style }: PairChipProps) => {
	const changeValue = Number(change ?? pair?.coefficient ?? 0);
	const content = (
		<>
			<TokenIcon assetId={pair?.first_currency?.asset_id} size={32} />

			<span className={styles.chip__info}>
				<span className={styles.chip__ticker}>
					{pair?.first_currency?.name ?? '...'}
					<em>/{pair?.second_currency?.name || 'ZANO'}</em>
				</span>
				<span className={styles.chip__name}>
					{pair?.first_currency?.asset_info?.full_name ||
						pair?.first_currency?.name ||
						'Zano asset'}
				</span>
			</span>

			<span className={styles.chip__price}>
				<span
					className={classes(
						styles.chip__rate,
						changeValue > 0 && styles.up,
						changeValue < 0 && styles.down,
					)}
				>
					{formatTokenAmount(rate ?? pair?.rate ?? 0, 8)}
				</span>
				<span className={styles.chip__usd}>{rateUsd ? `~ $${rateUsd}` : 'ZANO'}</span>
			</span>

			<ChevronDownIcon className={styles.chip__chevron} />
		</>
	);

	if (!onClick) {
		return (
			<div className={classes(styles.chip, className)} style={style}>
				{content}
			</div>
		);
	}

	return (
		<button
			type="button"
			className={classes(styles.chip, className)}
			onClick={onClick}
			style={style}
			aria-label="Change asset"
		>
			{content}
		</button>
	);
};

export default PairChip;
