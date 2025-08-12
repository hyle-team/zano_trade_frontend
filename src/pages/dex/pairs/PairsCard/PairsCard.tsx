import { useContext } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { ReactComponent as ArrowRight } from '@/assets/images/UI/arrow_right.svg';
import { Store } from '@/store/store-reducer';
import PairData from '@/interfaces/common/PairData';
import { getAssetIcon, notationToString, roundTo } from '@/utils/utils';
import styles from './PairsCard.module.scss';

interface IProps {
	pair: PairData;
}

export default function PairsCard({ pair }: IProps) {
	const router = useRouter();
	const { state } = useContext(Store);

	const firstCurrency = pair.first_currency;
	const secondCurrency = pair.second_currency;

	const isFeatured = pair.featured;

	const secondAssetUsdPrice = state.assetsRates.get(secondCurrency.asset_id || '') ?? 0;

	const price = Number(roundTo(notationToString(pair.rate ?? 0), 2));
	const currentPriceUSD = secondAssetUsdPrice ? price : 0;
	const priceUSD = currentPriceUSD
		? String(`$${(secondAssetUsdPrice * price).toFixed(2)}`)
		: String(`$${(secondAssetUsdPrice * price).toFixed(0)}`);

	const coefficient = pair?.coefficient || 0;
	const coefficientOutput =
		parseFloat(coefficient?.toFixed(2) || '0') === -100
			? -99.99
			: parseFloat(coefficient?.toFixed(2) || '0');

	const volume = Number(roundTo(notationToString(pair.volume ?? 0), 2));
	const currentVolumeUSD = secondAssetUsdPrice ? volume : 0;
	const volumeUSD = currentVolumeUSD
		? String(`$${(secondAssetUsdPrice * volume).toFixed(2)}`)
		: String(`$${(secondAssetUsdPrice * volume).toFixed(0)}`);

	const handleClick = () => {
		router.push(`/dex/trading/${pair.id}`);
	};

	return (
		<div className={styles.card}>
			<div className={styles.card__header}>
				<Image
					width={18}
					height={18}
					src={getAssetIcon(String(firstCurrency.asset_id))}
					alt="currency"
				/>
				<div className={styles.currency_name}>
					<span>{firstCurrency.name}</span>
					<span>/</span>
					<span>{secondCurrency.name}</span>
				</div>
				{isFeatured && (
					<Image src="/ui/featured.svg" alt="featured" width={24} height={24} />
				)}
			</div>
			<div className={styles.card__body}>
				<div className={styles.card__body_wrapper}>
					<div className={styles.card__body_row}>
						<div className={styles.card__body_column}>
							<p>
								{`Price ${secondCurrency.name ? `(${secondCurrency.name})` : ''}`}{' '}
							</p>
							<div className={styles.card__body_column_content}>
								<div className={styles.card__body_column_price}>
									<span>{price}</span>
									<span
										style={{ color: coefficient >= 0 ? '#16D1D6' : '#FF6767' }}
									>
										{' '}
										{coefficient >= 0 ? '+' : ''}
										{coefficientOutput}%
									</span>
								</div>
								<span>{priceUSD}</span>
							</div>
						</div>
						<div className={styles.card__body_column}>
							<p>24h Volume</p>
							<div className={styles.card__body_column_content}>
								<span>{volume}</span>
								<span>{volumeUSD}</span>
							</div>
						</div>
					</div>

					<div className={styles.card__button_wrapper}>
						<button className={styles.card__button} onClick={handleClick}>
							<ArrowRight />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
