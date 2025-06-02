import Filters from '@/components/UI/Filters/Filters';
import { useContext, useEffect, useState } from 'react';
import { getFormattedCurrencies, getPage } from '@/utils/methods';
import { Store } from '@/store/store-reducer';
import MarketplaceProps from '@/interfaces/props/pages/p2p/components/Marketplace/MarketplaceProps';
import FiltersState from '@/interfaces/states/FiltersState';
import HomeTable from '../HomeTable/HomeTable';
import Pagination from '../Pagination/Pagination';
import styles from './Marketplace.module.scss';

function Marketplace(props: MarketplaceProps) {
	const offers = props.value || [];
	const setOffers = props.setValue;

	const { state } = useContext(Store);

	const [currenciesElements, setCurrencies] = useState(
		getFormattedCurrencies(state.config?.currencies || []),
	);

	useEffect(() => {
		setCurrencies(getFormattedCurrencies([...(state.config?.currencies || [])]));
	}, [state.config?.currencies]);

	const [preloaderState, setPreloaderState] = useState(false);

	const [currFiltersState, setCurrFiltersState] = useState<FiltersState>({
		buyState: true,
		price: '',
		inputCurrency: null,
		targetCurrency: null,
	});

	const [tempFiltersState, setTempFiltersState] = useState<FiltersState>({
		buyState: true,
		price: '',
		inputCurrency: null,
		targetCurrency: null,
	});

	const [pageState, setPageState] = useState<number>(1);

	const [priceDescending, setPriceState] = useState(true);

	const [pagesCount, setPagesCount] = useState(1);

	async function getOffersPage() {
		setPreloaderState(true);

		setOffers([]);

		const result = (
			await Promise.all([
				getPage({
					type: currFiltersState.buyState ? 'buy' : 'sell',
					price: parseFloat(currFiltersState.price) || undefined,
					priceDescending,
					page: pageState,
					input_currency_id:
						currFiltersState?.inputCurrency?.id !== '-1'
							? currFiltersState.inputCurrency?.id
							: undefined,
					target_currency_id:
						currFiltersState?.targetCurrency?.id !== '-1'
							? currFiltersState.targetCurrency?.id
							: undefined,
				}),
				new Promise<void>((resolve) => {
					setTimeout(() => {
						resolve();
					}, 1000);
				}),
			])
		).filter((e) => e)[0];

		if (!(result && result.success)) return setPreloaderState(false);

		setOffers(result.success ? result.data.offers : []);
		setPagesCount(result.data.pages);
		setPreloaderState(false);
	}

	useEffect(() => {
		async function updateCurrencies() {
			if (!tempFiltersState.inputCurrency && !tempFiltersState.targetCurrency) {
				setTempFiltersState({
					...tempFiltersState,
					inputCurrency: { id: '-1', name: 'All', code: 'all' },
					targetCurrency: { id: '-1', name: 'All', code: 'all' },
				});
			}

			if (!currFiltersState.inputCurrency && !currFiltersState.targetCurrency) {
				setCurrFiltersState({
					...tempFiltersState,
					inputCurrency: { id: '-1', name: 'All', code: 'all' },
					targetCurrency: { id: '-1', name: 'All', code: 'all' },
				});
			}
		}

		updateCurrencies();
	}, [state.config?.currencies]);

	useEffect(() => {
		getOffersPage();
	}, [currFiltersState, pageState, priceDescending, state.__triggers.offers]);

	return (
		<div className={styles.marketplace}>
			<div>
				<Filters
					withSearch
					refreshClick={() => {
						if (pageState !== 1) {
							setPageState(1);
							return;
						}
						getOffersPage();
					}}
					searchClick={() => {
						setCurrFiltersState(tempFiltersState);
						setPageState(1);
					}}
					currencies={currenciesElements}
					value={tempFiltersState}
					setValue={setTempFiltersState}
					stateForBtns={currFiltersState}
					setStateForBtns={(e: FiltersState) => {
						setCurrFiltersState(e);
						setTempFiltersState(e);
					}}
				/>
			</div>

			{/* <Offers preloaderState={preloaderState} value={priceDescending} setValue={setPriceState} offers={offers}/> */}
			<HomeTable
				preloaderState={preloaderState}
				priceDescending={priceDescending}
				setPriceState={setPriceState}
				offers={offers}
			/>
			{!!offers.length && pagesCount > 1 && (
				<Pagination totalPages={pagesCount} value={pageState} setValue={setPageState} />
			)}
		</div>
	);
}

export default Marketplace;
