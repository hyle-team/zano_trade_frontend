import SegmentedTabs from '@/components/UI/SegmentedTabs';
import { ChartIcon, SwapArrowsIcon } from '@/components/UI/Icons';
import { SwapMode } from '@/utils/swap';
import { setStoredDexMode } from '@/utils/dexMode';

interface ModeSwitchProps {
	mode: SwapMode;
	onChange: (_mode: SwapMode) => void;
	className?: string;
}

export function getAdvancedModeHref(pairId?: string | number | null) {
	return pairId ? `/dex/trading/${pairId}` : '/dex?mode=advanced';
}

const ModeSwitch = ({ mode, onChange, className }: ModeSwitchProps) => {
	const onSelect = (next: SwapMode) => {
		if (next === mode) return;

		setStoredDexMode(next);
		onChange(next);
	};

	return (
		<SegmentedTabs<SwapMode>
			className={className}
			value={mode}
			onChange={onSelect}
			tabs={[
				{
					value: 'standard',
					label: (
						<>
							<SwapArrowsIcon width={16} height={16} />
							Standard
						</>
					),
				},
				{
					value: 'advanced',
					label: (
						<>
							<ChartIcon />
							Advanced
						</>
					),
				},
			]}
		/>
	);
};

export default ModeSwitch;
