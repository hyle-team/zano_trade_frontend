import Button from '@/components/UI/Button/Button';
import RefreshIcon from '@/assets/images/UI/refresh_icon.svg';
import Input from '@/components/UI/Input/Input';
import CurrencyDropdown from '@/components/UI/CurrencyDropdown/CurrencyDropdown';
import FiltersProps from '@/interfaces/props/components/UI/Filters/FiltersProps';
import CurrencyRow from '@/interfaces/common/CurrencyRow';
import styles from './Filters.module.scss';

// filtersState = {
//     buyState: true,
//     price: 0,
//     inputCurrency: {
//         name: "FIRO",
//         icon: firoIcon
//     },
//     targetCurrency: {
//         name: "FIRO",
//         icon: firoIcon
//     }
// }

function Filters(props: FiltersProps) {
	const filtersState = props.value;
	const setFiltersState = props.setValue;

	const stateForBtns = props.stateForBtns !== undefined ? props.stateForBtns : filtersState;
	const setStateForBtns =
		props.setStateForBtns !== undefined ? props.setStateForBtns : setFiltersState;

	// const [inputDropdownState, setInputState] = useState(currenciesElements[0].data[0]);
	// const [targetDropdownState, setTargetState] = useState(currenciesElements[0].data[0]);

	return (
		<div
			className={`${!props.inPopup ? styles.filters : styles.filters__popup} ${props.className || ''}`}
		>
			<div>
				<div className={styles.filters__switch}>
					<Button
						className={!stateForBtns.buyState ? styles.btn_unselected : ''}
						onClick={() =>
							!stateForBtns.buyState
								? setStateForBtns({ ...filtersState, buyState: true })
								: null
						}
					>
						Buy
					</Button>
					<Button
						className={stateForBtns.buyState ? styles.btn_unselected : ''}
						onClick={() =>
							stateForBtns.buyState
								? setStateForBtns({ ...filtersState, buyState: false })
								: null
						}
					>
						Sell
					</Button>
				</div>
				<CurrencyDropdown
					noStars={props.noStars}
					content={props.currencies.filter((e) => e.name === 'Crypto currencies')}
					withAll={props.withSearch}
					className={styles.filters__dropdown}
					value={filtersState.inputCurrency}
					setValue={(e: CurrencyRow) =>
						setFiltersState({ ...filtersState, inputCurrency: e })
					}
				/>
			</div>
			<div className={styles.filters__for}>
				<p>for</p>
			</div>
			<div>
				<div className={styles.filters__price__wrapper}>
					<Input
						type="number"
						min="0"
						max="10000000000"
						placeholder="0"
						value={filtersState.price}
						onInput={(e) => setFiltersState({ ...filtersState, price: e.target.value })}
					/>
					<CurrencyDropdown
						noStars={props.noStars}
						withAll={props.withSearch}
						content={props.currencies.filter((e) => e.name === 'Fiat currencies')}
						className={styles.filters__price__dropdown}
						// header={{ title: "ZANO", image: zanoIcon }}
						value={filtersState.targetCurrency}
						setValue={(e) => setFiltersState({ ...filtersState, targetCurrency: e })}
					/>
				</div>
				{props.withSearch && (
					<div className={styles.filters__buttons}>
						<Button
							onClick={props.searchClick}
							transparent={true}
							className={styles.filters__search_button}
						>
							Search
						</Button>
						<Button
							onClick={props.refreshClick}
							className={styles.filters__update_button}
						>
							{/* <img src={refreshIcon} alt="refresh"/> */}
							<RefreshIcon />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

export default Filters;
