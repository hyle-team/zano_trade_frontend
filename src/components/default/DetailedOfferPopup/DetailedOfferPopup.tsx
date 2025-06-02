import { ChangeEvent, useContext, useState } from 'react';
import crossIcon from '@/assets/images/UI/cross_icon.svg';
import ProfileWidget from '@/components/UI/ProfileWidget/ProfileWidget';
import Input from '@/components/UI/Input/Input';
import Button from '@/components/UI/Button/Button';
import { Store } from '@/store/store-reducer';
import Alert from '@/components/UI/Alert/Alert';
import { createChat } from '@/utils/methods';
import DepositTitle from '@/components/UI/DepositTitle/DepositTitle';
import { useRouter } from 'next/router';
import AlertType from '@/interfaces/common/AlertType';
import DetailedOfferPopupProps from '@/interfaces/props/components/default/DetailedOfferPopup/DetailedOfferPopupProps';
import styles from './DetailedOfferPopup.module.scss';

function DetailedOfferPopup(props: DetailedOfferPopupProps) {
	const [popupAlertState, setPopupAlertState] = useState<AlertType>(null);
	const [popupAlertSubtitle, setPopupAlertSubtitle] = useState<string | null>(null);
	const [payInputState, setPayInputState] = useState('');
	const [receiveInputState, setReceiveInputState] = useState('');
	const { offerData } = props;

	const router = useRouter();

	const { state } = useContext(Store);

	async function startChat() {
		const successedInput = payInputState && receiveInputState;

		const rangeAcceptable =
			parseFloat(offerData.type === 'buy' ? receiveInputState : payInputState) >=
				offerData.min &&
			parseFloat(offerData.type === 'buy' ? receiveInputState : payInputState) <=
				offerData.max &&
			parseFloat(receiveInputState) >= 0;

		if (!successedInput) {
			setPopupAlertState('error');
			setPopupAlertSubtitle('Please, fill all fields');
			setTimeout(() => {
				setPopupAlertState(null);
			}, 3000);
			return;
		}

		if (!rangeAcceptable) {
			setPopupAlertState('error');
			setPopupAlertSubtitle('Please, set correct values');
			setTimeout(() => {
				setPopupAlertState(null);
			}, 3000);
			return;
		}

		setPopupAlertState('loading');
		setPopupAlertSubtitle('Creating chat...');
		const result = await createChat(offerData.number, payInputState, receiveInputState);
		if (!result.success) {
			setPopupAlertState('error');
			setPopupAlertSubtitle('Error creating chat.');
			setTimeout(() => {
				setPopupAlertState(null);
			}, 3000);
			return;
		}

		router.push(`/p2p/process/${result.data}`);
	}

	function calcInput(e: ChangeEvent<HTMLInputElement>) {
		const value =
			props.offerData.type === 'buy'
				? parseFloat(e.target.value) / offerData.price
				: parseFloat(e.target.value) * offerData.price;

		setPayInputState(e.target.value);
		setReceiveInputState(value.toFixed(9));
	}

	function caclTarget(e: ChangeEvent<HTMLInputElement>) {
		const value =
			props.offerData.type === 'buy'
				? parseFloat(e.target.value) * offerData.price
				: parseFloat(e.target.value) / offerData.price;

		setReceiveInputState(e.target.value);
		setPayInputState(value.toFixed(9));
	}

	function setAll() {
		const maxInCurrency = offerData.max;
		const maxInTarget = parseFloat((offerData.max * offerData.price).toFixed(9));

		setPayInputState((props.offerData.type === 'buy' ? maxInTarget : maxInCurrency).toString());

		setReceiveInputState(
			(props.offerData.type === 'buy' ? maxInCurrency : maxInTarget).toString(),
		);
	}

	const inputLimits = `${offerData.min * offerData.price} - ${offerData.max * offerData.price}`;
	const outputPrice = `${offerData.min} - ${offerData.max}`;

	const firstInputPlaceholder = props.offerData.type === 'buy' ? inputLimits : outputPrice;

	const secondInputPlaceholder = props.offerData.type === 'buy' ? outputPrice : inputLimits;

	return (
		<div className={styles.popup__content}>
			<div>
				<h5>Detailed Offer</h5>
				<img onClick={() => props.setPopupState(false)} src={crossIcon} alt="close" />
			</div>
			<div>
				<div className={styles.popup__content__info}>
					<ProfileWidget withLink={false} offerData={offerData} />
					<div className={styles.popup__description__row}>
						<div className={styles.popup__description__pair}>
							<p>Price</p>
							<p
								className={
									offerData.type === 'buy'
										? styles.popup__buy__price
										: styles.popup__sell__price
								}
							>{`${offerData.price} ${offerData.target_currency?.name}`}</p>
						</div>
					</div>

					<div className={styles.popup__description__row}>
						<div className={styles.popup__description__pair}>
							<p>Min</p>
							<p>
								{offerData.min} {offerData.input_currency?.name}
							</p>
						</div>
						<div className={styles.popup__description__pair}>
							<p>Max</p>
							<p>
								{offerData.max} {offerData.input_currency?.name}
							</p>
						</div>
					</div>
					<div className={styles.popup__description__terms}>
						{offerData.comment && <h6>Comment</h6>}
						<p>{offerData.comment || ''}</p>
					</div>
				</div>
				<div className={styles.popup__content__form}>
					<div className={styles.popup__deposit__wrapper}>
						<div className={styles.popup__deposit}>
							<DepositTitle />
							<div>
								<div className={styles.deposit__pair}>
									<p>You</p>
									<p>
										{offerData.deposit_buyer}{' '}
										{offerData.deposit_currency?.name || ''}
									</p>
								</div>
								<div className={styles.deposit__pair}>
									<p>Seller</p>
									<p>
										{offerData.deposit_seller}{' '}
										{offerData.deposit_currency?.name || ''}
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className={styles.popup__input__wrapper}>
						<p className={styles.popup__input_label}>I pay</p>
						<div>
							<Input
								type="number"
								value={payInputState}
								onInput={calcInput}
								bordered={true}
								placeholder={firstInputPlaceholder}
							/>
							<div>
								<p>
									{props.offerData.type === 'buy'
										? offerData.target_currency?.name
										: offerData.input_currency?.name}
								</p>
								<Button className={styles.selected} onClick={setAll}>
									All
								</Button>
							</div>
						</div>
					</div>
					<div className={styles.popup__input__wrapper}>
						<p className={styles.popup__input_label}>I receive</p>
						<div>
							<Input
								type="number"
								onInput={caclTarget}
								value={receiveInputState}
								className={styles.receive__input}
								bordered={true}
								placeholder={secondInputPlaceholder}
							/>
							<p>
								{props.offerData.type === 'buy'
									? offerData.input_currency?.name
									: offerData.target_currency?.name}
							</p>
						</div>
					</div>
					<div className={styles.popup__button__wrapper}>
						<Button
							onClick={startChat}
							disabled={
								!state.wallet?.connected ||
								offerData.address === state.user?.address
							}
							className={`${styles.popup__button__action} ${props.offerData.type === 'buy' ? styles.btn_buy : styles.btn_sell}`}
						>
							Start Discussion
						</Button>

						<Button
							className={styles.popup__button__cancel}
							transparent={true}
							onClick={() => props.setPopupState(false)}
						>
							Cancel
						</Button>
					</div>
					<p className={styles.popup__form__description}>
						Vivamus suscipit, nisi vel consequat condimentum, diam est volutpat nisi,
						quis scelerisque dui odio non tellus.
					</p>
				</div>
			</div>

			{popupAlertState && (
				<Alert
					type={popupAlertState}
					subtitle={popupAlertSubtitle || ''}
					close={() => setPopupAlertState(null)}
				/>
			)}
		</div>
	);
}

export default DetailedOfferPopup;
