import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import ClockIcon from '@/assets/images/UI/clock_icon.svg';
import UpIcon from '@/assets/images/UI/up_icon.svg';
import DownIcon from '@/assets/images/UI/down_icon.svg';
import VolumeIcon from '@/assets/images/UI/volume_icon.svg';
import questionIcon from '@/assets/images/UI/question.svg?url';
import { roundTo, notationToString } from '@/utils/utils';
import { useTour } from '@/store/guide-provider';
import PairChip from '@/components/dex/PairChip';
import AssetSelectModal from '@/components/dex/swap/AssetSelectModal';
import ModeSwitch from '@/components/dex/swap/ModeSwitch';
import { SwapMode } from '@/utils/swap';
import styles from './styles.module.scss';
import StatItem from './components/StatItem';
import { TradingHeaderProps } from './types';
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
	const router = useRouter();
	const { start, isRunning } = useTour('dex-onboarding');
	const [assetPickerOpen, setAssetPickerOpen] = useState(false);

	const firstCurrencyName = pairData?.first_currency?.name || '';
	const secondCurrencyName = pairData?.second_currency?.name || '';

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

	const onModeChange = (next: SwapMode) => {
		if (next !== 'standard') return;
		router.push(pairData ? `/dex?pair=${pairData.id}` : '/dex');
	};

	return (
		<>
			<DexGuide />
			<div className={styles.header}>
				<div className={styles.header__stats}>
					<PairChip
						pair={pairData}
						rate={pairStats?.rate ?? pairData?.rate}
						rateUsd={pairRateUsd}
						change={coefficientOutput}
						onClick={() => setAssetPickerOpen(true)}
					/>

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

					{stats.map(({ Img, title, value, coefficient: statCoefficient }) => (
						<StatItem
							key={title}
							className={styles.header__stats_item}
							Img={Img}
							title={title}
							value={value}
							coefficient={statCoefficient}
						/>
					))}
				</div>

				<div className={styles.header__actions}>
					<ModeSwitch mode="advanced" onChange={onModeChange} />

					<button
						onClick={start}
						disabled={isRunning}
						className={styles.header__actions_guide}
						aria-label="Trading guide"
					>
						<Image src={questionIcon} width={24} height={24} alt="guide" />
					</button>
				</div>
			</div>

			<AssetSelectModal
				open={assetPickerOpen}
				onClose={() => setAssetPickerOpen(false)}
				selectedPairId={pairData ? String(pairData.id) : null}
				onSelect={(pair) => {
					if (String(pair.id) === String(pairData?.id)) return;
					router.push(`/dex/trading/${pair.id}`);
				}}
			/>
		</>
	);
};

export default TradingHeader;
