import { Store } from '@/store/store-reducer';
import { createOrder } from '@/utils/methods';
import { ChangeEvent, useContext, useRef, useState } from 'react';
import Input from '@/components/UI/Input/Input';
import RangeInput from '@/components/UI/RangeInput/RangeInput';
import ConnectButton from '@/components/UI/ConnectButton/ConnectButton';
import Button from '@/components/UI/Button/Button';
import { useRouter } from 'next/router';
import { classes, formatDollarValue } from '@/utils/utils';
import InputPanelItemProps from '@/interfaces/props/pages/dex/trading/InputPanelItem/InputPanelItemProps';
import LabeledInputProps from '@/interfaces/props/pages/dex/trading/InputPanelItem/LabeledInputProps';
import CreateOrderData from '@/interfaces/fetch-data/create-order/CreateOrderData';
import Decimal from 'decimal.js';
import HorizontalSelectProps from '@/interfaces/props/components/UI/HorizontalSelect/HorizontalSelectProps';
import SelectValue from '@/interfaces/states/pages/dex/trading/InputPanelItem/SelectValue';
import { nanoid } from 'nanoid';
import Alert from '@/components/UI/Alert/Alert';
import infoIcon from '@/assets/images/UI/info_alert_icon.svg';
import Image from 'next/image';
import styles from './InputPanelItem.module.scss';

function DexBuySellSwitch({ body, value, setValue }: HorizontalSelectProps<SelectValue>) {
	return (
		<div className={styles['buy-sell-switch']}>
			{body.map((e) => {
				let itemClass = styles['buy-sell-switch__item'];

				if (value.code === e.code) {
					itemClass +=
						e.code === 'buy'
							? ` ${styles['item_selected-buy']}`
							: ` ${styles['item_selected-sell']}`;
				}

				return (
					<button key={nanoid()} className={itemClass} onClick={() => setValue(e)}>
						{e.name}
					</button>
				);
			})}
		</div>
	);
}

function InputPanelItem(props: InputPanelItemProps) {
	const { state } = useContext(Store);

	const router = useRouter();

	const {
		priceState = '',
		amountState = '',
		totalState = '',
		buySellValues,
		buySellState = buySellValues[0],
		setBuySellState,
		setPriceFunction,
		setAmountFunction,
		setAlertState,
		setAlertSubtitle,
		setRangeInputValue,
		rangeInputValue = '50',
		firstCurrencyName = '',
		secondCurrencyName = '',
		balance = 0,
		amountValid,
		priceValid,
		totalValid,
		totalUsd,
		scrollToOrderList,
		updateUserOrders
	} = props;

	const [creatingState, setCreatingState] = useState(false);

	const [hasImmediateMatch, setHasImmediateMatch] = useState(false);

	function LabeledInput(props: LabeledInputProps) {
		const labelRef = useRef<HTMLParagraphElement>(null);
		const {
			label = '',
			placeholder = '',
			currency = '',
			value,
			readonly,
			usd,
			setValue,
			invalid,
		} = props;

		const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
			if (!readonly && setValue) {
				setValue(e.currentTarget.value);
			}
		};

		return (
			<div
				className={classes(styles.labeled_input, invalid && styles.labeled_input__invalid)}
			>
				<h6>{label}</h6>
				<div>
					<Input
						bordered
						placeholder={placeholder}
						value={value}
						readOnly={readonly}
						onInput={handleInput}
					/>
					{usd && (
						<div className={styles.labeled_input__value}>
							<p>~${formatDollarValue(usd)}</p>
						</div>
					)}
					<div className={styles.labeled_input__currency} ref={labelRef}>
						<p>{currency}</p>
					</div>
				</div>
			</div>
		);
	}

	const isBuy = buySellState?.code === 'buy';

	async function postOrder() {
		const price = new Decimal(priceState);
		const amount = new Decimal(amountState);

		const isFull =
			price.greaterThan(0) &&
			price.lessThan(1000000000) &&
			amount.greaterThan(0) &&
			amount.lessThan(1000000000);

		if (!isFull) return;

		const orderData: CreateOrderData = {
			type: isBuy ? 'buy' : 'sell',
			side: 'limit',
			price: price.toString(),
			amount: amount.toString(),
			pairId: typeof router.query.id === 'string' ? router.query.id : '',
		};

		setCreatingState(true);
		const result = await createOrder(orderData);
		setCreatingState(false);

		if (result.success) {
			if (result.data?.immediateMatch) {
				setHasImmediateMatch(true);
			}
		} else {
			setAlertState('error');
			if (result.data === 'Same order') {
				setAlertSubtitle('Order already exists');
			} else {
				setAlertSubtitle('Failed to create order');
			}

			setTimeout(() => {
				setAlertState(null);
				setAlertSubtitle('');
			}, 3000);
		}

		updateUserOrders();
	}

	function onRangeInput(e: ChangeEvent<HTMLInputElement>) {
		setRangeInputValue(e.target.value);
		if (balance) {
			const rangeValue = new Decimal(e.target.value || '0');
			const balanceDecimal = new Decimal(balance || '0');
			const calculatedAmount = balanceDecimal.mul(rangeValue.div(100)).toString();
			setAmountFunction(calculatedAmount || '');
		}
	}

	let buttonText;

	if (creatingState) {
		buttonText = 'Creating...';
	} else if (isBuy) {
		buttonText = 'Buy';
	} else {
		buttonText = 'Sell';
	}

	return (
		<div className={styles.input_panel__item}>
			{hasImmediateMatch && (
				<Alert
					type="custom"
					customContent={
						<div className={styles.apply__alert}>
							<Image src={infoIcon} alt="success" width={64} height={64} />
							<div className={styles.apply__alert__content}>
								<h2>Apply the order</h2>
								<p>You have to apply the order</p>
								<Button
									className={styles.apply__alert__button}
									onClick={() => {
										scrollToOrderList();
										setHasImmediateMatch(false);
									}}
								>
									Apply now
								</Button>
							</div>
						</div>
					}
					close={() => setHasImmediateMatch(false)}
				/>
			)}

			<div>
				<h5>New order</h5>
				<DexBuySellSwitch
					body={buySellValues}
					value={buySellState}
					setValue={setBuySellState}
				/>
			</div>

			<div>
				{LabeledInput({
					value: priceState,
					setValue: setPriceFunction,
					currency: secondCurrencyName,
					placeholder: '0.00',
					label: 'Price',
					invalid: !!priceState && !priceValid,
				})}
				{LabeledInput({
					value: amountState,
					setValue: setAmountFunction,
					currency: firstCurrencyName,
					placeholder: '0.00',
					label: 'Amount',
					invalid: !!amountState && !amountValid,
				})}
				<RangeInput value={rangeInputValue} onInput={onRangeInput} />
				{LabeledInput({
					value: totalState,
					setValue: () => undefined,
					currency: secondCurrencyName,
					placeholder: '0.00',
					label: 'Total',
					readonly: true,
					invalid: !!totalState && !totalValid,
					usd: totalUsd,
				})}
				{state.wallet?.connected ? (
					<Button
						disabled={!priceValid || !amountValid || !totalValid}
						onClick={postOrder}
						className={isBuy ? styles.buy_btn : styles.sell_btn}
					>
						{buttonText}
					</Button>
				) : (
					<ConnectButton className={isBuy ? styles.buy_btn : styles.sell_btn} />
				)}
				<div className={styles.input_panel__fees}>
					<p>
						Fee: <span style={{ color: isBuy ? '#16D1D6' : '#FF6767' }}>0.01 Zano</span>
					</p>
				</div>
			</div>
		</div>
	);
}

export default InputPanelItem;
