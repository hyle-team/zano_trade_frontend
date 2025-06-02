import CurrencyContentRow from '@/interfaces/common/CurrencyContentRow';
import FiltersState from '@/interfaces/states/FiltersState';
import { CSSProperties, Dispatch, SetStateAction } from 'react';

interface FiltersProps {
	value: FiltersState;
	setValue: Dispatch<SetStateAction<FiltersState>>;
	stateForBtns: FiltersState;
	setStateForBtns: (_e: FiltersState) => void;
	inPopup?: boolean;
	className?: string;
	style?: CSSProperties;
	noStars?: boolean;
	withSearch?: boolean;
	refreshClick: () => void;
	searchClick: () => void;
	currencies: CurrencyContentRow[];
}

export default FiltersProps;
