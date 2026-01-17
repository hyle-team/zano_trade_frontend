import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import styles from '@/styles/Dex.module.scss';
import SearchLogo from '@/assets/images/UI/search_icon.svg';
import RefreshIcon from '@/assets/images/UI/refrash_small_icon.svg';
import InfoSmallIcon from '@/assets/images/UI/info_outlined.svg';
import DropdownArrowIcon from '@/assets/images/UI/dropdown_arrow_small.svg';
import FilterIcon from '@/assets/images/UI/filter_icon.svg';
import Input from '@/components/UI/Input/Input';
import { Switch } from '@/components/UI/Switch/Switch';
import { IconDropdown } from '@/components/UI/IconDropdown/IconDropdown';
import Dropdown from '@/components/UI/Dropdown/Dropdown';
import { getPairsPagesAmount } from '@/utils/methods';
import PairData from '@/interfaces/common/PairData';
import { PairSortOption } from '@/interfaces/enum/pair';

interface IProps {
	pairInputState: string;
	whitelistedOnly: boolean;
	setWhitelistedOnly: Dispatch<SetStateAction<boolean>>;
	setPairInputState: Dispatch<SetStateAction<string>>;
	setLoadedState: Dispatch<SetStateAction<boolean>>;
	setPairs: Dispatch<SetStateAction<PairData[]>>;
	setShouldUpdatePairSearch: Dispatch<SetStateAction<boolean>>;
	setCurrentPage: Dispatch<SetStateAction<number>>;
	sortOption: PairSortOption;
	setSortOption: Dispatch<SetStateAction<PairSortOption>>;
	fetchPairs(): Promise<void>;
}

const SORT_OPTION = {
	VOLUME: {
		LOW_TO_HIGH: 'Volume: Low to High',
		HIGH_TO_LOW: 'Volume: High to Low',
	},
};

const sortOptions = [
	{ name: SORT_OPTION.VOLUME.LOW_TO_HIGH, value: PairSortOption.VOLUME_LOW_TO_HIGH },
	{ name: SORT_OPTION.VOLUME.HIGH_TO_LOW, value: PairSortOption.VOLUME_HIGH_TO_LOW },
];

function DexHeader({
	pairInputState,
	whitelistedOnly,
	setWhitelistedOnly,
	setCurrentPage,
	setShouldUpdatePairSearch,
	setPairInputState,
	setPairs,
	setLoadedState,
	setSortOption,
	sortOption,
	fetchPairs,
}: IProps) {
	const [isRefetching, setIsRefetching] = useState(false);

	const updatePairsSearch = useCallback((_pairInputState: string, _whitelistedOnly: boolean) => {
		setLoadedState(false);
		setPairs([]);
		setCurrentPage(1);
		setShouldUpdatePairSearch(true);
	}, []);

	const handleClickRefetch = async () => {
		setIsRefetching(true);

		try {
			setCurrentPage(1);
			await fetchPairs();
			await getPairsPagesAmount(pairInputState, whitelistedOnly);
		} catch (e) {
			console.error('Refetch failed:', e);
		} finally {
			setIsRefetching(false);
			setLoadedState(true);
		}
	};

	const handleClickSwitch = () => {
		const currentState = localStorage.getItem('all_pairs');

		if (currentState === 'false') {
			localStorage.setItem('all_pairs', `true`);
		}

		if (currentState === 'true' || !currentState) {
			localStorage.setItem('all_pairs', `false`);
		}

		setWhitelistedOnly(!whitelistedOnly);
		updatePairsSearch(pairInputState, !whitelistedOnly);
	};

	const handleSortChange = (option: PairSortOption) => {
		setSortOption(option);
		handleClickRefetch();
	};

	return (
		<div className={styles.dex__header}>
			<div className={styles.dex__row}>
				<div className={styles['dex__input-block']}>
					<div className={styles['dex__input-block-wrapper']}>
						<div className={styles.input_wrapper}>
							<SearchLogo />
							<Input
								placeholder="Enter an asset..."
								className={styles.input}
								value={pairInputState}
								onInput={(e) => {
									const newInput = e.target.value;
									setPairInputState(newInput);
									updatePairsSearch(newInput, whitelistedOnly);
								}}
							/>
						</div>
					</div>

					<div className={styles['dex__toggle_block-wrapper']}>
						<InfoSmallIcon />
						<p>All pairs</p>
						<Switch checked={!whitelistedOnly} onChange={handleClickSwitch} />
					</div>
				</div>

				<div className={styles['dex__action-block']}>
					<Dropdown
						body={sortOptions.map((option) => ({
							name: option.name,
							value: option.value,
						}))}
						value={{
							name: sortOptions.find((o) => o.value === sortOption)?.name || '',
						}}
						setValue={(val) => handleSortChange(val.value as PairSortOption)}
						icon={<DropdownArrowIcon />}
						className={styles.sort_dropdown}
						selfContained
					/>

					<button
						className={
							isRefetching ? styles['refresh_button-refetch'] : styles.refresh_button
						}
						onClick={handleClickRefetch}
					>
						<RefreshIcon />
					</button>
				</div>

				<IconDropdown
					className={styles['dex__icon-filter']}
					items={[
						{
							content: SORT_OPTION.VOLUME.LOW_TO_HIGH,
							onClick: () => handleSortChange(PairSortOption.VOLUME_LOW_TO_HIGH),
						},
						{
							content: SORT_OPTION.VOLUME.HIGH_TO_LOW,
							onClick: () => handleSortChange(PairSortOption.VOLUME_HIGH_TO_LOW),
						},
					]}
				>
					<div className={styles['dex__filter-button']}>
						<FilterIcon />
					</div>
				</IconDropdown>
			</div>

			<div className={styles.dex__row_modile}>
				<div className={styles['dex__toggle_block-wrapper']}>
					<InfoSmallIcon />
					<p>All pairs</p>
					<Switch checked={!whitelistedOnly} onChange={handleClickSwitch} />
				</div>
			</div>
		</div>
	);
}

export default DexHeader;
