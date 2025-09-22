import { ReactComponent as ClockIcon } from '@/assets/images/UI/clock_icon.svg';
import { ReactComponent as UpIcon } from '@/assets/images/UI/up_icon.svg';
import { ReactComponent as DownIcon } from '@/assets/images/UI/down_icon.svg';
import { ReactComponent as VolumeIcon } from '@/assets/images/UI/volume_icon.svg';
import BackButton from '@/components/default/BackButton/BackButton';
import { roundTo, notationToString, classes } from '@/utils/utils';
import questionIcon from '@/assets/images/UI/question.svg';
import Image from 'next/image';
import { useTour } from '@/store/guide-provider';
import styles from './styles.module.scss';
import StatItem from './components/StatItem';
import { TradingHeaderProps } from './types';
import CurrencyIcon from './components/CurrencyIcon';
import AssetRow from './components/AssetRow';
import DexGuide from './components/DexGuide';

const TradingHeader = ({
	pairStats,
	pairRateUsd,
	firstAssetLink,
	secondAssetLink,
	firstAssetId,
	secondAssetId,
	pairData,
}: TradingHeaderProps) => {
	const { start, isRunning } = useTour('dex-onboarding');

	const currencyNames = {
		firstCurrencyName: pairData?.first_currency?.name || '',
		secondCurrencyName: pairData?.second_currency?.name || '',
	};

	const { firstCurrencyName, secondCurrencyName } = currencyNames;

	const coefficient = pairStats?.coefficient || 0;
	const coefficientOutput =
		parseFloat(coefficient?.toFixed(2) || '0') === -100
			? -99.99
			: parseFloat(coefficient?.toFixed(2) || '0');

	const stats = [
		{
			Img: ClockIcon,
			title: '24h change',
			value: `${roundTo(notationToString(pairStats?.rate || 0), 4)}`,
			coefficient: coefficientOutput,
		},
		{
			Img: UpIcon,
			title: '24h high',
			value: `${roundTo(notationToString(pairStats?.high || 0), 4)}`,
		},
		{
			Img: DownIcon,
			title: '24h low',
			value: `${roundTo(notationToString(pairStats?.low || 0), 4)}`,
		},
		{
			Img: VolumeIcon,
			title: `24h volume (${secondCurrencyName})`,
			value: `${roundTo(notationToString(pairStats?.volume || 0), 4)}`,
		},
	];

	return (
		<>
			<DexGuide />
			<div className={styles.header}>
				<div className={styles.header__stats}>
					<div className={styles.header__currency}>
						<div className={styles.header__currency_icon}>
							<CurrencyIcon code={firstAssetId} />
						</div>

						<div className={styles.header__currency_item}>
							<p className={styles.currencyName}>
								{!pairData ? (
									'...'
								) : (
									<>
										{firstCurrencyName}
										<span>/{secondCurrencyName}</span>
									</>
								)}
							</p>

							<div className={styles.price}>
								<p
									className={classes(
										styles.price__secondCurrency,
										coefficientOutput >= 0 ? styles.green : styles.red,
									)}
								>
									{roundTo(notationToString(pairStats?.rate || 0, 8))}
								</p>
								{pairRateUsd && (
									<p className={styles.price__usd}>~ ${pairRateUsd}</p>
								)}
							</div>
						</div>
					</div>

					{pairData && firstAssetLink && secondAssetLink && (
						<div className={styles.header__stats_assets}>
							<AssetRow
								name={firstCurrencyName}
								link={firstAssetLink}
								id={firstAssetId || ''}
								code={firstAssetId}
							/>
							<AssetRow
								name={secondCurrencyName}
								link={secondAssetLink}
								id={secondAssetId || ''}
								code={secondAssetId}
							/>
						</div>
					)}

					{stats.map(({ Img, title, value, coefficient }) => (
						<StatItem
							key={title}
							className={styles.header__stats_item}
							Img={Img}
							title={title}
							value={value}
							coefficient={coefficient}
						/>
					))}
				</div>

				<div className={styles.header__actions}>
					<button
						onClick={start}
						disabled={isRunning}
						className={styles.header__actions_guide}
					>
						<Image src={questionIcon} width={24} height={24} alt="guide" />
					</button>

					<BackButton className={styles.header__actions_backBtn} isSm />
				</div>
			</div>
		</>
	);
};

export default TradingHeader;
