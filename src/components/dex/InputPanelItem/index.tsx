import { Store } from '@/store/store-reducer';
import { createOrder } from '@/utils/methods';
import { ChangeEvent, useContext, useState } from 'react';
import RangeInput from '@/components/UI/RangeInput/RangeInput';
import ConnectButton from '@/components/UI/ConnectButton/ConnectButton';
import Button from '@/components/UI/Button/Button';
import { useRouter } from 'next/router';
import { classes, formatDollarValue, notationToString } from '@/utils/utils';
import InputPanelItemProps from '@/interfaces/props/pages/dex/trading/InputPanelItem/InputPanelItemProps';
import CreateOrderData from '@/interfaces/fetch-data/create-order/CreateOrderData';
import Decimal from 'decimal.js';
import Alert from '@/components/UI/Alert/Alert';
import infoIcon from '@/assets/images/UI/info_alert_icon.svg';
import Image from 'next/image';
import { useAlert } from '@/hook/useAlert';
import { buySellValues } from '@/constants';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from './styles.module.scss';
import LabeledInput from './components/LabeledInput';

function InputPanelItem(props: InputPanelItemProps) {
	const {
		priceState = '',
		amountState = '',
		totalState = '',
		buySellState = buySellValues[0],
		setBuySellState,
		setPriceFunction,
		setAmountFunction,
		setRangeInputValue,
		rangeInputValue = '50',
		balance = 0,
		amountValid,
		priceValid,
		totalValid,
		totalUsd,
		scrollToOrderList,
		currencyNames,
		onAfter,
	} = props;

	const { state } = useContext(Store);
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { setAlertState, setAlertSubtitle } = useAlert();
	const [creatingState, setCreatingState] = useState(false);
	const { firstCurrencyName, secondCurrencyName } = currencyNames;

	const [hasImmediateMatch, setHasImmediateMatch] = useState(false);
	const isBuy = buySellState?.code === 'buy';

	function goToSuitableTab() {
		const params = new URLSearchParams(searchParams.toString());
		params.set('tab', 'matches');

		router.replace(`${pathname}?${params.toString()}`, undefined, {
			shallow: true,
			scroll: false,
		});
	}

	function resetForm() {
		setPriceFunction('');
		setAmountFunction('');
		setRangeInputValue('50');
	}

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
			onAfter();
			resetForm();
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
	}

	function onRangeInput(e: ChangeEvent<HTMLInputElement>) {
		setRangeInputValue(e.target.value);
		if (balance > 0) {
			const rangeValue = new Decimal(e.target.value || '0');
			const balanceDecimal = new Decimal(balance);
			const calculatedAmount = balanceDecimal.mul(rangeValue.div(100)).toString();
			setAmountFunction(calculatedAmount || '');
		}
	}

	const buttonText = creatingState ? 'Creating...' : 'Create Order';
	const isButtonDisabled = !priceValid || !amountValid || !totalValid || creatingState;

	return (
		<div className={styles.inputPanel}>
			{hasImmediateMatch && (
				<Alert
					type="custom"
					customContent={
						<div className={styles.applyAlert}>
							<Image src={infoIcon} alt="success" width={64} height={64} />
							<div className={styles.applyAlert__content}>
								<h2>Apply the order</h2>
								<p>You have to apply the order</p>
								<Button
									className={styles.applyAlert__button}
									onClick={() => {
										scrollToOrderList();
										goToSuitableTab();
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

			<div className={styles.inputPanel__header}>
				<h5 className={styles.title}>Trade</h5>
			</div>

			<div className={styles.inputPanel__body}>
				<div className={styles.inputPanel__selector}>
					<button
						onClick={() => setBuySellState(buySellValues[1])}
						className={classes(
							styles.inputPanel__selector_item,
							buySellState.code === 'buy' && styles.buy,
						)}
					>
						Buy
					</button>
					<button
						onClick={() => setBuySellState(buySellValues[2])}
						className={classes(
							styles.inputPanel__selector_item,
							buySellState.code === 'sell' && styles.sell,
						)}
					>
						Sell
					</button>
				</div>

				<LabeledInput
					value={priceState}
					setValue={setPriceFunction}
					currency={secondCurrencyName}
					label="Price"
					invalid={!!priceState && !priceValid}
				/>

				<LabeledInput
					value={amountState}
					setValue={setAmountFunction}
					currency={firstCurrencyName}
					label="Quantity"
					invalid={!!amountState && !amountValid}
				/>

				<div>
					<RangeInput value={rangeInputValue} onInput={onRangeInput} />
					<div className={styles.inputPanel__body_labels}>
						<p className={styles.inputPanel__body_labels__item}>0%</p>
						<p className={styles.inputPanel__body_labels__item}>100%</p>
					</div>
				</div>

				<div className={styles.inputPanel__body_labels}>
					<p className={styles.inputPanel__body_labels__item}>
						Available <span className={styles.balance}>Balance</span>
					</p>
					<p className={styles.inputPanel__body_labels__item}>
						<span>{balance || 0}</span> {firstCurrencyName}
					</p>
				</div>

				<div className={styles.inputPanel__body_total}>
					<LabeledInput
						value={notationToString(totalState)}
						setValue={() => undefined}
						currency={secondCurrencyName}
						label="Total"
						readonly={true}
						invalid={!!totalState && !totalValid}
					/>

					<div className={classes(styles.inputPanel__body_labels, styles.mobileWrap)}>
						<p className={styles.inputPanel__body_labels__item}>
							Fee: <span>0.01</span> ZANO
						</p>

						<p className={styles.inputPanel__body_labels__item}>
							~ ${formatDollarValue(totalUsd || '0')}
						</p>
					</div>
				</div>
				{state.wallet?.connected ? (
					<Button
						disabled={isButtonDisabled}
						onClick={postOrder}
						className={classes(
							styles.inputPanel__body_btn,
							isBuy ? styles.buy : styles.sell,
						)}
					>
						{buttonText}
					</Button>
				) : (
					<ConnectButton className={styles.inputPanel__body_btn} />
				)}
			</div>
		</div>
	);
}

export default InputPanelItem;
