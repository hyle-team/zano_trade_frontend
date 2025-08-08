import { ReactComponent as ClockIcon } from '@/assets/images/UI/clock_icon.svg';
import { ReactComponent as UpIcon } from '@/assets/images/UI/up_icon.svg';
import { ReactComponent as DownIcon } from '@/assets/images/UI/down_icon.svg';
import { ReactComponent as VolumeIcon } from '@/assets/images/UI/volume_icon.svg';
import BackButton from '@/components/default/BackButton/BackButton';
import { tradingKnownCurrencies, roundTo, notationToString } from '@/utils/utils';
import styles from './styles.module.scss';
import StatItem from '../StatItem';
import { TradingHeaderProps } from './types';
import CurrencyIcon from './components/CurrencyIcon';
import AssetRow from './components/AssetRow';

const getCurrencyCode = (code?: string) =>
	tradingKnownCurrencies.includes(code || '') ? code : 'tsds';

const TradingHeader = ({
	pairStats,
	pairRateUsd,
	firstAssetLink,
	secondAssetLink,
	firstAssetId,
	secondAssetId,
	pairData,
}: TradingHeaderProps) => {
	const currencyNames = {
		firstCurrencyName: pairData?.first_currency?.name || '',
		secondCurrencyName: pairData?.second_currency?.name || '',
	};

	const { firstCurrencyName, secondCurrencyName } = currencyNames;
	const imgCode = getCurrencyCode(pairData?.first_currency?.code || '');
	const imgCode2 = getCurrencyCode(pairData?.second_currency?.code || '');

	const coefficient = pairStats?.coefficient || 0;
	const coefficientOutput =
		parseFloat(coefficient?.toFixed(2) || '0') === -100
			? -99.99
			: parseFloat(coefficient?.toFixed(2) || '0');

	const stats = [
		{
			Img: ClockIcon,
			title: '24h change',
			value: `${roundTo(notationToString(pairStats?.rate || 0), 8)} ${secondCurrencyName}`,
			coefficient: coefficientOutput,
		},
		{
			Img: UpIcon,
			title: '24h high',
			value: `${roundTo(notationToString(pairStats?.high || 0), 8)} ${secondCurrencyName}`,
		},
		{
			Img: DownIcon,
			title: '24h low',
			value: `${roundTo(notationToString(pairStats?.low || 0), 8)} ${secondCurrencyName}`,
		},
		{
			Img: VolumeIcon,
			title: '24h volume',
			value: `${roundTo(notationToString(pairStats?.volume || 0), 8)} ${secondCurrencyName}`,
		},
	];

	return (
		<div className={styles.header}>
			<div className={styles.header__currency}>
				<div className={styles.header__currency_icon}>
					<CurrencyIcon code={imgCode} />
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
						<p className={styles.price__secondCurrency}>
							{notationToString(pairStats?.rate || 0)} {secondCurrencyName}
						</p>
						{pairRateUsd && <p className={styles.price__usd}>~ ${pairRateUsd}</p>}
					</div>
				</div>
			</div>

			<div className={styles.header__stats}>
				{pairData && firstAssetLink && secondAssetLink && (
					<div className={styles.header__stats_assets}>
						<AssetRow
							name={firstCurrencyName}
							link={firstAssetLink}
							id={firstAssetId || ''}
							code={imgCode}
						/>
						<AssetRow
							name={secondCurrencyName}
							link={secondAssetLink}
							id={secondAssetId || ''}
							code={imgCode2}
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

			<BackButton />
		</div>
	);
};

export default TradingHeader;
