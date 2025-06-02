import React from 'react';
import { Button, Input, Spin, Typography, Checkbox } from 'antd';
import DateRangeSelector from '@/components/UI/DateRangeSelector/DateRangeSelector';
import styles from './styles.module.scss';

interface DateState {
	first: Date | null;
	last: Date | null;
}

interface PairStatsProps {
	loading: boolean;
	volumeStats: number | null;
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
	<div className={styles.admin__volume}>
		<div className={styles.admin__volume_form}>
			<Input
				className={`${styles.admin__volume_input} ${styles.admin__form_input}`}
				placeholder="Enter Address"
				value={selectedAddress}
				onChange={(e) => setSelectedAddress(e.target.value)}
			/>
			<Input
				className={`${styles.admin__volume_input} ${styles.admin__form_input}`}
				placeholder="Enter Pair ID"
				value={selectedPairID}
				onChange={(e) => setSelectedPairID(e.target.value)}
			/>
			<div className={styles.admin__volume_range}>
				<DateRangeSelector
					disabled={allDates}
					className={styles.admin__volume_range__date}
					value={dateRange}
					setValue={setDateRange}
				/>
			</div>
		</div>

		<div className={styles.admin__volume_btns}>
			<Button
				type="primary"
				size="large"
				className={styles.admin__form_btn}
				onClick={fetchVolumeStats}
				disabled={loading}
			>
				{loading ? <Spin /> : 'Fetch Volume Stats'}
			</Button>

			<label className={styles.allDates} htmlFor="all-date">
				<Checkbox
					checked={allDates}
					onChange={(e) => setAllDates(e.target.checked)}
					id="all-date"
				/>
				<span> All dates</span>
			</label>
		</div>

		{volumeStats !== null && (
			<Typography.Paragraph
				style={{
					margin: '20px 0',
					backgroundColor: '#000000',
					color: '#ffffff',
					padding: '16px',
					borderRadius: '8px',
					fontFamily: 'monospace',
					whiteSpace: 'pre-wrap',
				}}
			>
				{JSON.stringify(volumeStats, null, 2)}
			</Typography.Paragraph>
		)}
	</div>
);

export default PairStats;
