import crossIcon from '@/assets/images/UI/cross_icon.svg';
import Input from '@/components/UI/Input/Input';
import Button from '@/components/UI/Button/Button';
import Alert from '@/components/UI/Alert/Alert';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import useUpdateUser from '@/hook/useUpdateUser';
import { getFormattedCurrencies, updateOffer } from '@/utils/methods';
import { Store } from '@/store/store-reducer';
import triggerOffers from '@/store/triggers';
import Dropdown from '@/components/UI/Dropdown/Dropdown';
import CurrencyDropdown from '@/components/UI/CurrencyDropdown/CurrencyDropdown';
import DepositTitle from '@/components/UI/DepositTitle/DepositTitle';
import CreateOfferPopupProps from '@/interfaces/props/components/default/CreateOfferPopup/CreateOfferPopupProps';
import CurrencyContentRow from '@/interfaces/common/CurrencyContentRow';
import WindowedInputsProps, {
	DepositState,
	LimitsState,
} from '@/interfaces/props/components/default/CreateOfferPopup/WindowedInputsProps';
import AlertType from '@/interfaces/common/AlertType';
import CurrencyRow from '@/interfaces/common/CurrencyRow';
import UpdateOfferData from '@/interfaces/fetch-data/update-offer/UpdateOfferData';
import styles from './CreateOfferPopup.module.scss';

function CreateOfferPopup(props: CreateOfferPopupProps) {
	const { offerData } = props;

	const { state, dispatch } = useContext(Store);

	const depositCurrencies =
		state.config?.currencies.filter((e) => e?.type === 'deposit' || e?.code === 'zano') || [];

	const allowedDepositCurrencies = depositCurrencies.filter((e) =>
		(state.wallet?.assets || []).find((asset) => e.name === asset.ticker),
	);

	console.log(allowedDepositCurrencies);

	const [depositCurrency, setDepositCurrency] = useState<CurrencyRow>(
		offerData?.deposit_currency || allowedDepositCurrencies[0],
	);

	const [price, setPrice] = useState<string>(offerData?.price.toString() || '');

	const [firstCurrency, setFirstCurrency] = useState(
		(offerData?.type === 'buy' ? offerData?.target_currency : offerData?.input_currency) ||
			null,
	);
	const [secondCurrency, setSecondCurrency] = useState(
		(offerData?.type === 'buy' ? offerData?.input_currency : offerData?.target_currency) ||
			null,
	);

	const [currenciesElements, setCurrencies] = useState<CurrencyContentRow[]>([]);

	const [alertState, setAlertState] = useState<AlertType>(null);

	const [alertSubtitle, setAlertSubtitle] = useState<string | null>(null);

	const fetchUser = useUpdateUser();

	const [limits, setLimits] = useState<LimitsState>({
		min: offerData?.min.toString() || '',
		max: offerData?.max.toString() || '',
	});

	const [deposit, setDeposit] = useState<DepositState>({
		seller: offerData?.deposit_seller.toString() || '',
		buyer: offerData?.deposit_buyer.toString() || '',
	});

	const [commentState, setCommentState] = useState(offerData?.comment || '');

	useEffect(() => {
		(async () => {
			const allCurrencies = state.config?.currencies || [];

			const formattedCurrencies = getFormattedCurrencies(allCurrencies || []);

			setCurrencies(formattedCurrencies);

			if (!firstCurrency && !secondCurrency) {
				setFirstCurrency(allCurrencies[0] ? allCurrencies[0] : null);
				setSecondCurrency(
					allCurrencies.filter((e) => e.type === 'fiat')[0]
						? allCurrencies.filter((e) => e.type === 'fiat')[0]
						: null,
				);
			}
		})();
	}, [state.config?.currencies]);

	async function sendUpdateRequest() {
		const limitsMin = parseFloat(limits.min);
		const limitsMax = parseFloat(limits.max);

		const depositBuyer = parseFloat(deposit.buyer);
		const depositSeller = parseFloat(deposit.seller);

		const offerPrice = parseFloat(price);

		const successedInput =
			limits.min && limits.max && firstCurrency && secondCurrency && depositCurrency;

		const rangeCorrect =
			limitsMin > 0 &&
			limitsMin < 1000000000 &&
			limitsMax > 0 &&
			limitsMax < 1000000000 &&
			depositBuyer > 0 &&
			depositBuyer < 1000000000 &&
			depositSeller > 0 &&
			depositSeller < 1000000000 &&
			parseFloat(price) > 0 &&
			parseFloat(price) < 10000000000 &&
			limitsMin < limitsMax &&
			(firstCurrency?.type === 'fiat') === (secondCurrency?.type === 'crypto');

		if (!successedInput) {
			setAlertState('error');
			setAlertSubtitle('Please, fill all fields');
			setTimeout(() => setAlertState(null), 3000);
			return;
		}

		if (!rangeCorrect) {
			setAlertState('error');
			setAlertSubtitle('Please, set correct values');
			setTimeout(() => setAlertState(null), 3000);
			return;
		}

		const offerType = firstCurrency.type === 'fiat' ? 'buy' : 'sell';

		const offerNewData: UpdateOfferData = {
			number: offerData?.number || undefined,
			price: offerPrice,
			min: limitsMin,
			max: limitsMax,
			deposit_seller: depositSeller,
			deposit_buyer: depositBuyer,
			type: offerType,
			comment: commentState || '',
			input_currency_id: offerType === 'buy' ? secondCurrency.id : firstCurrency.id,
			target_currency_id: offerType === 'buy' ? firstCurrency.id : secondCurrency.id,
			deposit_currency_id: depositCurrency.id,
		};

		setAlertState('loading');
		setAlertSubtitle('Updating offer data');
		const result = await updateOffer(offerNewData);
		if (!result.success) {
			setAlertState('error');
			setAlertSubtitle('Server error occured.');
			setTimeout(() => setAlertState(null), 3000);
			return;
		}
		setAlertState('success');

		triggerOffers(dispatch);

		props.setPopupState(false);
		await fetchUser();
		setTimeout(() => setAlertState(null), 3000);
		// setAlertState(null);
	}

	function WindowedInputs(props: WindowedInputsProps) {
		function updateState(e: ChangeEvent<HTMLInputElement>, key: string) {
			props.setValue({
				...props.value,
				[key]: e.target.value,
			});
		}

		return (
			<div
				className={`${styles.windowed_inputs__wrapper} ${!props.limits ? styles.blue : styles.grey}`}
			>
				<div className={styles.windowed_inputs}>
					<div className={styles.windowed_inputs__title}>
						{props.limits ? <h6>Limits</h6> : <DepositTitle />}
					</div>
					<div className={styles.windowed_inputs__pair}>
						{props.limits ? (
							<p>Min</p>
						) : (
							<p>{firstCurrency?.type === 'crypto' ? 'You' : 'Seller'}</p>
						)}
						<div>
							<Input
								bordered
								min="0"
								max="10000000000"
								placeholder="0.00"
								onInput={(e) => updateState(e, props.limits ? 'min' : 'seller')}
								type="number"
								// value={props.limits ? offerData.min || "" : offerData.deposit_seller || ""}
								value={props.limits ? limits.min : deposit.seller}
							/>
							<p>{props.limits ? firstCurrency?.name : depositCurrency?.name}</p>
						</div>
					</div>
					<div className={styles.windowed_inputs__pair}>
						{props.limits ? (
							<p>Max</p>
						) : (
							<p>{secondCurrency?.type === 'crypto' ? 'You' : 'Buyer'}</p>
						)}
						<div>
							<Input
								bordered
								max="10000000000"
								placeholder="0.00"
								onInput={(e) => updateState(e, props.limits ? 'max' : 'buyer')}
								type="number"
								value={props.limits ? limits.max || '' : deposit.buyer || ''}
							/>
							<p>{props.limits ? firstCurrency?.name : depositCurrency?.name}</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.create_offer__popup}>
			<div>
				<h5>{props.edit ? 'Edit' : 'Create'} Offer</h5>
				<img onClick={() => props.setPopupState(false)} src={crossIcon} alt="close" />
			</div>
			<div>
				{/* <div className={styles.create_offer__filters}>
                    <h6>Offer type</h6>
                    <Filters noStars={true} currencies={currenciesElements} setValue={setFiltersState} value={filtersState} inPopup/>
                </div>    */}
				<div className={styles.create_offer__pay}>
					<h6>I pay</h6>
					<CurrencyDropdown
						noStars
						content={currenciesElements || []}
						className={styles.filters__dropdown}
						value={firstCurrency}
						setValue={(e) => setFirstCurrency(e)}
					/>
				</div>
				<div className={styles.create_offer__receive}>
					<h6>I receive</h6>
					<CurrencyDropdown
						noStars
						content={currenciesElements || []}
						className={styles.filters__dropdown}
						value={secondCurrency}
						setValue={(e) => setSecondCurrency(e)}
					/>
				</div>
				<div className={styles.create_offer__price}>
					<h6>Price for 1 {firstCurrency?.name || ''}</h6>
					<Input
						value={price}
						type="number"
						onInput={(e) => setPrice(e.target.value)}
						bordered
						placeholder={`0 ${secondCurrency?.name}`}
					/>
				</div>
				<div className={styles.create_offer__deposit}>
					<h6>Deposit currency</h6>
					<Dropdown
						body={allowedDepositCurrencies || []}
						value={depositCurrency}
						setValue={setDepositCurrency}
						selfContained
						withImages
					/>
				</div>
				<div className={styles.create_offer__parameters}>
					{WindowedInputs({ value: limits, setValue: setLimits, limits: true })}
					{WindowedInputs({ value: deposit, setValue: setDeposit })}
				</div>
				<div className={styles.create_offer__comment}>
					<h6>Comment</h6>
					<textarea
						placeholder="Write your comment here"
						value={commentState}
						onInput={(e: ChangeEvent<HTMLTextAreaElement>) =>
							setCommentState(e.target.value)
						}
					></textarea>
				</div>
				<div className={styles.create_offer__buttons}>
					<div>
						<Button onClick={sendUpdateRequest}>
							{props.edit ? 'Save' : 'Create'}
						</Button>
						<Button onClick={() => props.setPopupState(false)} transparent>
							Cancel
						</Button>
					</div>
					<p>
						Vivamus suscipit, nisi vel consequat condimentum, diam est volutpat nisi,
						quis scelerisque dui odio non tellus.
					</p>
				</div>
			</div>

			{alertState && (
				<Alert
					type={alertState}
					subtitle={alertSubtitle || ''}
					close={() => setAlertState(null)}
				/>
			)}
		</div>
	);
}

export default CreateOfferPopup;
