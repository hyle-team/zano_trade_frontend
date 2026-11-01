import TokenIcon from '@/components/UI/TokenIcon';
import { classes } from '@/utils/utils';
import { formatTokenAmount } from '@/utils/swap';
import PairData from '@/interfaces/common/PairData';
import styles from './styles.module.scss';

interface FeaturedPairsProps {
	pairs: PairData[];
	selectedPairId?: string | null;
	onSelect: (_pair: PairData) => void;
}

const FeaturedPairs = ({ pairs, selectedPairId, onSelect }: FeaturedPairsProps) => {
	if (!pairs.length) return null;

	return (
		<section className={styles.featured}>
			<h2 className={styles.featured__title}>Featured pairs</h2>

			<div className={styles.table}>
				<div className={styles.table__head}>
					<span>Pair</span>
					<span className={styles.table__right}>24h volume</span>
					<span className={styles.table__right}>Price</span>
					<span className={styles.table__right}>Change</span>
				</div>

				{pairs.map((pair) => {
					const change = Number(pair.coefficient || 0);

					return (
						<button
							key={pair.id}
							type="button"
							className={classes(
								styles.row,
								String(pair.id) === String(selectedPairId) && styles.row__selected,
							)}
							onClick={() => onSelect(pair)}
						>
							<span className={styles.row__pair}>
								<TokenIcon assetId={pair.first_currency?.asset_id} size={40} />
								<span className={styles.row__info}>
									<span className={styles.row__ticker}>
										{pair.first_currency?.name}
										<em> / {pair.second_currency?.name || 'ZANO'}</em>
									</span>
									<span className={styles.row__name}>
										{pair.first_currency?.asset_info?.full_name ||
											pair.first_currency?.name}
									</span>
								</span>
							</span>

							<span className={classes(styles.row__volume, styles.table__right)}>
								{formatTokenAmount(pair.volume || 0, 2)} <em>ZANO</em>
							</span>

							<span className={classes(styles.row__price, styles.table__right)}>
								{formatTokenAmount(pair.rate || 0, 8)}
							</span>

							<span
								className={classes(
									styles.row__change,
									styles.table__right,
									change > 0 && styles.up,
									change < 0 && styles.down,
								)}
							>
								{change > 0 ? '+' : ''}
								{change.toFixed(2)}%
							</span>
						</button>
					);
				})}
			</div>
		</section>
	);
};

export default FeaturedPairs;
