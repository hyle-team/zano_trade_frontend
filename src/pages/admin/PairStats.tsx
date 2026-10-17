import React from 'react';
import DateRangeSelector from '@/components/UI/DateRangeSelector/DateRangeSelector';
import Button from '@/components/UI/Button/Button';
import { Switch } from '@/components/UI/Switch/Switch';
import { ChartIcon } from '@/components/UI/Icons';
import { formatTokenAmount } from '@/utils/swap';
import styles from './styles.module.scss';

interface DateState {
	first: Date | null;
	last: Date | null;
}

interface VolumeStatsResponse {
	success?: boolean;
	data?: { volume?: string } | string;
}

interface PairStatsProps {
	loading: boolean;
	volumeStats: VolumeStatsResponse | null;
	selectedAddress: string;
	setSelectedAddress: React.Dispatch<React.SetStateAction<string>>;
	selectedPairID: string;
	setSelectedPairID: React.Dispatch<React.SetStateAction<string>>;
	allDates: boolean;
	setAllDates: React.Dispatch<React.SetStateAction<boolean>>;
	dateRange: DateState;
	setDateRange: React.Dispatch<React.SetStateAction<DateState>>;
	fetchVolumeStats: () => void;
}

const renderResult = (volumeStats: VolumeStatsResponse) => {
	const { success, data } = volumeStats;

	if (success && data && typeof data === 'object' && data.volume !== undefined) {
		return (
			<div className={styles.result}>
				<span className={styles.result__icon}>
					<ChartIcon />
				</span>
				<div>
					<p className={styles.result__label}>Traded volume</p>
					<p className={styles.result__value}>{formatTokenAmount(data.volume, 8)}</p>
				</div>
			</div>
		);
	}

	if (success === false && typeof data === 'string') {
		return (
			<div className={styles.result}>
				<p className={styles.result__error}>{data}</p>
			</div>
		);
	}

	return <pre className={styles.result__raw}>{JSON.stringify(volumeStats, null, 2)}</pre>;
};

const PairStats: React.FC<PairStatsProps> = ({
	loading,
	volumeStats,
	selectedAddress,
	setSelectedAddress,
	selectedPairID,
	setSelectedPairID,
	allDates,
	setAllDates,
	dateRange,
	setDateRange,
	fetchVolumeStats,
}) => (
	<section className={styles.section}>
		<div className={styles.section__head}>
			<div>
				<h2>Volume stats</h2>
				<p>Traded volume of an address on a pair for the selected period</p>
			</div>
		</div>

		<div className={styles.volume}>
			<div className={styles.field}>
				<span className={styles.field__label}>Address</span>
				<label className={styles.input}>
					<input
						placeholder="Enter address"
						value={selectedAddress}
						onChange={(e) => setSelectedAddress(e.target.value)}
					/>
				</label>
			</div>

			<div className={styles.field}>
				<span className={styles.field__label}>Pair ID</span>
				<label className={styles.input}>
					<input
						placeholder="Enter pair ID"
						inputMode="numeric"
						value={selectedPairID}
						onChange={(e) => setSelectedPairID(e.target.value)}
					/>
				</label>
			</div>

			<div className={styles.field}>
				<div className={styles.field__row}>
					<span className={styles.field__label}>Period</span>
					<label className={styles.toggle}>
						<span>All dates</span>
						<Switch checked={allDates} onChange={setAllDates} />
					</label>
				</div>
				<DateRangeSelector
					disabled={allDates}
					className={styles.dateFilter}
					value={dateRange}
					setValue={setDateRange}
				/>
			</div>

			<Button
				variant="primary"
				className={styles.volume__btn}
				onClick={fetchVolumeStats}
				loading={loading}
			>
				Fetch stats
			</Button>
		</div>

		{volumeStats !== null && renderResult(volumeStats)}
	</section>
);

export default PairStats;
