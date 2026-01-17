import arrowIcon from '@/assets/images/UI/arrow.svg?url';
import lockIcon from '@/assets/images/UI/lock.svg?url';
import crossIcon from '@/assets/images/UI/cross_icon.svg?url';
import deleteIcon from '@/assets/images/UI/delete.svg?url';
import editIcon from '@/assets/images/UI/edit.svg?url';
import noOffersIcon from '@/assets/images/UI/no_offers.svg?url';
import noChatsIcon from '@/assets/images/UI/no_chats.svg?url';
import Link from 'next/link';
import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import Popup from '@/components/UI/Popup/Popup';
import ProfileWidget from '@/components/UI/ProfileWidget/ProfileWidget';
import { useContext, useState } from 'react';
import { nanoid } from 'nanoid';
import { toStandardDateString } from '@/utils/utils';
import { createChat, deleteChat, deleteOffer } from '@/utils/methods';
import useUpdateUser from '@/hook/useUpdateUser';
import Alert from '@/components/UI/Alert/Alert';
import Preloader from '@/components/UI/Preloader/Preloader';
import { Store } from '@/store/store-reducer';
import { useRouter } from 'next/router';
import NotificationIndicator from '@/components/UI/NotificationIndicator/NotificationIndicator';
import { updateUser } from '@/store/actions';
import CreateOfferPopup from '../CreateOfferPopup/CreateOfferPopup';
import rowStyles from './Row.module.scss';
import styles from './Offers.module.scss';

function Offers(props) {
	// const [priceDescending, setPriceState] = useState(false);

	const priceDescending = props.value;
	const setPriceState = props.setValue;

	const router = useRouter();

	const { state, dispatch } = useContext(Store);

	const fetchUser = useUpdateUser();

	const [alertState, setAlertState] = useState(null);

	const [alertSubtitle, setAlertSubtitle] = useState(null);

	const { offers } = props;

	function PopupContent(props) {
		const [popupAlertState, setPopupAlertState] = useState(null);
		const [popupAlertSubtitle, setPopupAlertSubtitle] = useState(null);
		const [payInputState, setPayInputState] = useState('');
		const [receiveInputState, setReceiveInputState] = useState('');
		const { offerData } = props;

		async function startChat() {
			const successedInput = payInputState && receiveInputState;

			const rangeAcceptable =
				parseFloat(offerData.type === 'buy' ? receiveInputState : payInputState) >=
					parseFloat(offerData.min) &&
				parseFloat(offerData.type === 'buy' ? receiveInputState : payInputState) <=
					parseFloat(offerData.max) &&
				parseFloat(receiveInputState) >= 0 &&
				parseFloat(receiveInputState) <= 1000000000;

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

		function calcInput(e) {
			const value =
				props.offerData.type === 'buy'
					? e.target.value / offerData.price
					: e.target.value * offerData.price;

			setPayInputState(e.target.value);
			setReceiveInputState(parseFloat(value.toFixed(9)));
		}

		function caclTarget(e) {
			const value =
				props.offerData.type === 'buy'
					? e.target.value * offerData.price
					: e.target.value / offerData.price;

			setReceiveInputState(e.target.value);
			setPayInputState(parseFloat(value.toFixed(9)));
		}

		function setAll() {
			const maxInCurrency = parseFloat(offerData.max);
			const maxInTarget = parseFloat((offerData.max * offerData.price).toFixed(9));

			setPayInputState(props.offerData.type === 'buy' ? maxInTarget : maxInCurrency);

			setReceiveInputState(props.offerData.type === 'buy' ? maxInCurrency : maxInTarget);
		}

		const inputLimits = `${offerData.min * offerData.price} - ${offerData.max * offerData.price}`;
		const outputPrice = `${offerData.min} - ${offerData.max}`;

		const firstInputPlaceholder = props.offerData.type === 'buy' ? inputLimits : outputPrice;

		const secondInputPlaceholder = props.offerData.type === 'buy' ? outputPrice : inputLimits;

		return (
			<div className={rowStyles.popup__content}>
				<div>
					<h5>Detailed Offer</h5>
					<img onClick={() => props.setPopupState(false)} src={crossIcon} alt="close" />
				</div>
				<div>
					<div className={rowStyles.popup__content__info}>
						<ProfileWidget withLink={false} offerData={offerData} />
						<div className={rowStyles.popup__description__row}>
							<div className={rowStyles.popup__description__pair}>
								<p>Price</p>
								<p
									className={
										offerData.type === 'buy'
											? rowStyles.popup__buy__price
											: rowStyles.popup__sell__price
									}
								>{`${offerData.price} ${offerData.target_currency?.name}`}</p>
							</div>
						</div>

						<div className={rowStyles.popup__description__row}>
							<div className={rowStyles.popup__description__pair}>
								<p>Min</p>
								<p>
									{offerData.min} {offerData.input_currency?.name}
								</p>
							</div>
							<div className={rowStyles.popup__description__pair}>
								<p>Max</p>
								<p>
									{offerData.max} {offerData.input_currency?.name}
								</p>
							</div>
						</div>
						<div className={rowStyles.popup__description__terms}>
							{offerData.comment && <h6>Comment</h6>}
							<p>{offerData.comment || ''}</p>
						</div>
					</div>
					<div className={rowStyles.popup__content__form}>
						<div className={rowStyles.popup__deposit__wrapper}>
							<div className={rowStyles.popup__deposit}>
								<div>
									<img src={lockIcon} alt="lock" />
									<h6>Deposit</h6>
								</div>
								<div>
									<div className={rowStyles.deposit__pair}>
										<p>You</p>
										<p>
											{offerData.deposit_buyer}{' '}
											{offerData.deposit_currency?.name || ''}
										</p>
									</div>
									<div className={rowStyles.deposit__pair}>
										<p>Seller</p>
										<p>
											{offerData.deposit_seller}{' '}
											{offerData.deposit_currency?.name || ''}
										</p>
									</div>
								</div>
							</div>
						</div>
						<div className={rowStyles.popup__input__wrapper}>
							<p className={rowStyles.popup__input_label}>I pay</p>
							<div>
								<Input
									onWheel={(e) => e.target.blur()}
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
									<Button className={rowStyles.selected} onClick={setAll}>
										All
									</Button>
								</div>
							</div>
						</div>
						<div className={rowStyles.popup__input__wrapper}>
							<p className={rowStyles.popup__input_label}>I receive</p>
							<div>
								<Input
									onWheel={(e) => e.target.blur()}
									type="number"
									onInput={caclTarget}
									value={receiveInputState}
									className={rowStyles.receive__input}
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
						<div className={rowStyles.popup__button__wrapper}>
							<Button
								onClick={startChat}
								disabled={
									!state.wallet.connected ||
									offerData.address === state.user.address
								}
								className={`${rowStyles.popup__button__action} ${props.offerData.type === 'buy' ? rowStyles.btn_buy : rowStyles.btn_sell}`}
							>
								Start Discussion
							</Button>

							<Button
								className={rowStyles.popup__button__cancel}
								transparent={true}
								onClick={() => props.setPopupState(false)}
							>
								Cancel
							</Button>
						</div>
						<p className={rowStyles.popup__form__description}>
							Vivamus suscipit, nisi vel consequat condimentum, diam est volutpat
							nisi, quis scelerisque dui odio non tellus.
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

	function Row(props) {
		const [popupShown, setPopupState] = useState(false);

		async function removeOffer() {
			if (props.extended && !props.withEditor && props.offerData.offer_number) {
				setAlertState('loading');
				setAlertSubtitle('Deleting chat...');
				const result = await deleteChat(props.offerData.id);
				if (!result.success) {
					setAlertState('error');
					setAlertSubtitle('Error deleting chat. Please try again later.');
					setTimeout(() => {
						setAlertState(null);
					}, 3000);
					return;
				}
				setAlertState(null);
				await fetchUser();
				return;
			}

			setAlertState('loading');
			setAlertSubtitle('Deleting offer...');
			const result = await deleteOffer(props.offerData.number);
			if (!result.success) {
				setAlertState('error');
				setAlertSubtitle('Error deleting offer. Please try again later.');
				setTimeout(() => {
					setAlertState(null);
				}, 3000);
				return;
			}
			setAlertState(null);
			await fetchUser();
		}

		const withNotification = !(props.offerData?.view_list || []).includes(state.user?.id || '');

		function viewRedirect() {
			if (props.extended && !props.withEditor) {
				if (state.user?.id) {
					const newUser = JSON.parse(JSON.stringify({ ...state.user }));
					const currentViewList = newUser.chats.find(
						(e) => e.id === (props.offerData?.id || 0),
					)?.view_list;
					if (!currentViewList?.includes(state.user?.id))
						currentViewList.push(state.user?.id);

					updateUser(dispatch, newUser);
				}

				router.push(`/p2p/process/${props.offerData?.id || ''}`);
			}
		}

		return (
			<tr
				className={`${rowStyles.table__row} ${props.extended ? rowStyles.table__row__extended : ''}`}
			>
				{props.extended && (
					<>
						<td className={rowStyles.extended__hidden}>
							<div
								className={`${props.offerData.type === 'buy' ? rowStyles.table__offer_type__buy : rowStyles.table__offer_type__sell} ${rowStyles.table__offer_type}`}
							>
								<p>{props.offerData.type === 'buy' ? 'Buy' : 'Sell'}</p>
							</div>
						</td>
						<td className={rowStyles.extended__hidden}>
							<p className={rowStyles.table__date}>
								{`${toStandardDateString(new Date(parseInt(props.offerData.timestamp, 10)))} `}
								<br />
								{new Date(
									parseInt(props.offerData.timestamp, 10),
								).toLocaleTimeString()}
							</p>
						</td>

						<td className={`${rowStyles.extended__mobile} ${rowStyles.top_element}`}>
							<div
								className={`${props.offerData.type === 'buy' ? rowStyles.table__offer_type__buy : rowStyles.table__offer_type__sell} ${
									rowStyles.table__offer_type
								}`}
							>
								<p>{props.offerData.type === 'buy' ? 'Buy' : 'Sell'}</p>
							</div>

							<p className={rowStyles.table__date}>
								{props.offerData.date} {props.offerData.time}
							</p>
						</td>
					</>
				)}
				<td className={rowStyles.top_element}>
					{props.inUser ? (
						<div className={rowStyles.row__currency}>
							<img
								src={props.offerData.currencyIcon}
								alt={props.offerData.currency}
							/>
							<h4>{props.offerData.currency}</h4>
						</div>
					) : (
						<ProfileWidget offerData={props.offerData} />
					)}
				</td>
				<td>
					<p className={rowStyles.row__label__mobile}>Price</p>
					<p className={rowStyles.user_info__price}>
						<span>{props.offerData.price}</span> {props.offerData.target_currency?.name}
					</p>
				</td>
				<td>
					<p className={rowStyles.row__label__mobile}>Limit / Available</p>
					<div className={rowStyles.column__text}>
						<div>
							<p
								className={`${rowStyles.column__text__title} ${rowStyles.column__limits}`}
							>
								Min:
							</p>
							<p className={rowStyles.column__text__value}>
								{props.offerData.min} {props.offerData.input_currency?.name}
							</p>
						</div>

						<div>
							<p
								className={`${rowStyles.column__text__title} ${rowStyles.column__limits}`}
							>
								Max:
							</p>
							<p className={rowStyles.column__text__value}>
								{props.offerData.max} {props.offerData.input_currency?.name}
							</p>
						</div>
					</div>
				</td>
				<td>
					<div
						className={`${rowStyles.row__label__mobile} ${rowStyles.row__deposit__label}`}
					>
						<img src={lockIcon} alt="lock" />
						<Link href="/" onClick={(e) => e.preventDefault()}>
							Deposit
						</Link>
					</div>
					<div className={rowStyles.column__text}>
						<div>
							<p className={rowStyles.column__text__title}>Seller:</p>
							<p className={rowStyles.column__text__value}>
								{props.offerData.deposit_seller}{' '}
								{props.offerData.deposit_currency?.name || ''}
							</p>
						</div>

						<div>
							<p className={rowStyles.column__text__title}>Buyer:</p>
							<p className={rowStyles.column__text__value}>
								{props.offerData.deposit_buyer}{' '}
								{props.offerData.deposit_currency?.name || ''}
							</p>
						</div>
					</div>
				</td>
				<td className={rowStyles.row__button__wrapper}>
					{!props.extended ? (
						<div>
							<Button
								onClick={() => setPopupState(true)}
								className={
									props.offerData.type === 'buy'
										? rowStyles.btn_buy
										: rowStyles.btn_sell
								}
							>
								View details
							</Button>
						</div>
					) : (
						<div>
							{props.withEditor ? (
								<Button
									className={rowStyles.row__button__iconed}
									onClick={() => setPopupState(true)}
								>
									<img src={editIcon} alt="edit" />
								</Button>
							) : (
								<div className={rowStyles.row__button__view}>
									<Button onClick={viewRedirect}>View</Button>

									<div className={rowStyles.row__button__notification}>
										<NotificationIndicator count={withNotification ? 1 : 0} />
									</div>
								</div>
							)}
							{props.categoryState !== 'finished' &&
								props.categoryState !== 'active' && (
									<Button
										className={rowStyles.row__button__iconed}
										onClick={removeOffer}
									>
										<img src={deleteIcon} alt="delete" />
									</Button>
								)}
						</div>
					)}

					{popupShown && (
						<Popup
							settings={
								props.withEditor
									? { setPopupState, edit: true, offerData: props.offerData }
									: { offerData: props.offerData, setPopupState }
							}
							Content={props.withEditor ? CreateOfferPopup : PopupContent}
							blur={true}
							close={() => setPopupState(false)}
							scroll={true}
						/>
					)}
				</td>
			</tr>
		);
	}

	return (
		<div
			className={`${styles.offers__table__wrapper} ${props.extended ? styles.offers__table__extended : ''}`}
		>
			<table>
				<thead>
					<tr className={props.extended ? styles.header__row__extended : ''}>
						{props.extended && (
							<>
								<th>
									<Link href="/" onClick={(e) => e.preventDefault()}>
										Type
									</Link>
								</th>
								<th>
									<Link href="/" onClick={(e) => e.preventDefault()}>
										Date
									</Link>
								</th>
							</>
						)}
						<th>
							<Link href="/" onClick={(e) => e.preventDefault()}>
								Makers
							</Link>
						</th>
						<th>
							<div
								className={!props.extended ? styles.table__header__price : ''}
								onClick={() => setPriceState(!priceDescending)}
							>
								<Link href="/" onClick={(e) => e.preventDefault()}>
									Price
									{!props.extended &&
										(priceDescending ? ' (Descending)' : ' (Ascending)')}
								</Link>
								{!props.extended && (
									<img
										style={{
											transform: priceDescending ? 'rotateX(180deg)' : 'none',
										}}
										src={arrowIcon}
										alt="arrow"
									/>
								)}
							</div>
						</th>
						<th>
							<Link href="/" onClick={(e) => e.preventDefault()}>
								Limits
							</Link>
						</th>
						<th>
							<div>
								<img src={lockIcon} alt="lock" />
								<Link href="/" onClick={(e) => e.preventDefault()}>
									Deposit
								</Link>
							</div>
						</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{offers.map((e) => (
						<Row
							categoryState={props.categoryState}
							extended={props.extended}
							withEditor={props.withEditor}
							key={nanoid(16)}
							offerData={e}
						/>
					))}
				</tbody>
			</table>

			{!offers.length && !props.preloaderState && (
				<div className={styles.offers__no_offers}>
					<div>
						<img
							src={props.extended && !props.withEditor ? noChatsIcon : noOffersIcon}
							alt={props.extended && !props.withEditor ? 'no chats' : 'no offers'}
						></img>
						<p>No {props.extended && !props.withEditor ? 'chats' : 'offers'}</p>
					</div>
				</div>
			)}

			{props.preloaderState && (
				<div className={styles.offers__no_offers}>
					<div>
						<Preloader />
						<p>Loading...</p>
					</div>
				</div>
			)}

			<Alert
				type={alertState}
				subtitle={alertSubtitle || ''}
				close={() => setAlertState(null)}
			/>
		</div>
	);
}

export default Offers;
