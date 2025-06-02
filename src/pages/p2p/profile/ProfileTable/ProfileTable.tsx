import EmptyLink from '@/components/UI/EmptyLink/EmptyLink';
import DepositTitle from '@/components/UI/DepositTitle/DepositTitle';
import { ReactComponent as NoOffersIcon } from '@/assets/images/UI/no_offers.svg';
import { ReactComponent as NoChatsIcon } from '@/assets/images/UI/no_chats.svg';
import { toStandardDateString } from '@/utils/utils';
import ProfileWidget from '@/components/UI/ProfileWidget/ProfileWidget';
import PairText from '@/components/UI/PairText/PairText';
import Button from '@/components/UI/Button/Button';
import { ReactComponent as DeleteIcon } from '@/assets/images/UI/delete.svg';
import NotificationIndicator from '@/components/UI/NotificationIndicator/NotificationIndicator';
import { useContext, useState } from 'react';
import { Store } from '@/store/store-reducer';
import { nanoid } from 'nanoid';
import { updateUser } from '@/store/actions';
import { useRouter } from 'next/router';
import CreateOfferPopup from '@/components/default/CreateOfferPopup/CreateOfferPopup';
import Popup from '@/components/UI/Popup/Popup';
import Alert from '@/components/UI/Alert/Alert';
import { deleteChat, deleteOffer } from '@/utils/methods';
import useUpdateUser from '@/hook/useUpdateUser';
import AlertType from '@/interfaces/common/AlertType';
import OfferData from '@/interfaces/responses/offers/OfferData';
import { GetUserResData, UserChatData } from '@/interfaces/responses/user/GetUserRes';
import OffersStateElement from '@/interfaces/states/pages/p2p/profile/OffersState';
import ProfileTableProps from '@/interfaces/props/pages/p2p/profile/ProfileTable/ProfileTableProps';
import styles from './ProfileTable.module.scss';

function ProfileTable(props: ProfileTableProps) {
	const { categoryState } = props;
	const { offers } = props;

	const router = useRouter();

	const [alertState, setAlertState] = useState<AlertType>(null);
	const [alertSubtitle, setAlertSubtitle] = useState<string>('');

	const { state, dispatch } = useContext(Store);

	const fetchUser = useUpdateUser();

	function Row(params: { offerData: OffersStateElement }) {
		const { offerData } = params;

		const [popupShown, setPopupState] = useState(false);

		const isChat = categoryState !== 'my-offers';

		const withNotification = isChat
			? !((offerData as UserChatData)?.view_list || []).includes(state.user?.id || '')
			: false;

		async function removeOffer() {
			setAlertState('loading');
			setAlertSubtitle(`Deleting ${isChat ? 'chat' : 'offer'}...`);
			const result = isChat
				? await deleteChat(offerData.id)
				: await deleteOffer(offerData.number);
			if (!result.success) {
				setAlertState('error');
				setAlertSubtitle(
					`Error deleting ${isChat ? 'chat' : 'offer'}. Please try again later.`,
				);
				setTimeout(() => {
					setAlertState(null);
				}, 3000);
				return;
			}
			setAlertState(null);
			await fetchUser();
		}

		function viewRedirect() {
			if (categoryState !== 'my-offers') {
				if (state.user?.id) {
					const newUser: GetUserResData = JSON.parse(JSON.stringify({ ...state.user }));
					const currentViewList =
						newUser.chats.find((e) => e.id === (offerData?.id || 0))?.view_list || [];
					if (!currentViewList?.includes(state.user?.id))
						currentViewList.push(state.user?.id);

					updateUser(dispatch, newUser);
				}

				router.push(`/p2p/process/${offerData?.id || ''}`);
			}
		}

		return (
			<tr>
				<td>
					<div
						className={`${styles.type__marker} ${offerData?.type === 'buy' ? styles.marker__buy : styles.marker__sell}`}
					>
						<h6>{offerData?.type === 'buy' ? 'Buy' : 'Sell'}</h6>
					</div>
				</td>
				<td>
					<p className={styles.profile_table__date}>
						{`${toStandardDateString(new Date(parseInt(offerData.timestamp, 10)))} `}
						<br />
						{new Date(parseInt(offerData.timestamp, 10)).toLocaleTimeString()}
					</p>
				</td>
				<td>
					<ProfileWidget
						offerData={{
							alias: offerData.alias,
							address: offerData.address,
						}}
					/>
				</td>
				<td>
					<EmptyLink className={styles.profile__header__mobile}>Price</EmptyLink>
					<p className={styles.profile__row__price}>
						<span>{params.offerData.price}</span> {params.offerData.target_currency?.name}
					</p>
				</td>
				<td>
					<EmptyLink className={styles.profile__header__mobile}>Limits</EmptyLink>
					<PairText
						columnWidth={65}
						first={{
							key: 'Min',
							value: `${offerData.min} ${offerData.input_currency?.name}`,
						}}
						second={{
							key: 'Max',
							value: `${offerData.max} ${offerData.input_currency?.name}`,
						}}
					/>
				</td>
				<td>
					<DepositTitle className={styles.profile__header__mobile} />
					<PairText
						columnWidth={80}
						first={{
							key: 'Seller',
							value: `${offerData.deposit_seller} ${offerData.deposit_currency?.name}`,
						}}
						second={{
							key: 'Buyer',
							value: `${offerData.deposit_buyer} ${offerData.deposit_currency?.name}`,
						}}
					/>
				</td>
				<td>
					<div className={styles.profile_table__buttons}>
						{categoryState !== 'my-offers' && (
							<div className={styles.row__button__wrapper}>
								<Button onClick={viewRedirect}>View</Button>

								<div className={styles.row__button__notification}>
									<NotificationIndicator count={withNotification ? 1 : 0} />
								</div>
							</div>
						)}

						{/* {categoryState === "my-offers" && 
                            <Button
                                className={styles.row__button__iconed}
                                onClick={() => setPopupState(true)}
                            >
                                <EditIcon/>
                            </Button>
                        } */}

						{categoryState !== 'finished' && categoryState !== 'active' && (
							<Button className={styles.row__button__iconed} onClick={removeOffer}>
								<DeleteIcon />
							</Button>
						)}
					</div>

					{popupShown && (
						<Popup
							settings={{
								setPopupState,
								edit: true,
								offerData: params.offerData as OfferData,
							}}
							Content={CreateOfferPopup}
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
		<div className={styles.profile_table}>
			<table>
				<thead>
					<tr>
						<th>
							<EmptyLink>Type</EmptyLink>
						</th>
						<th>
							<EmptyLink>Date</EmptyLink>
						</th>
						<th>
							<EmptyLink>Makers</EmptyLink>
						</th>
						<th>
							<EmptyLink>Price</EmptyLink>
						</th>
						<th>
							<EmptyLink>Limits</EmptyLink>
						</th>
						<th>
							<DepositTitle />
						</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{offers.map((e) => (
						<Row key={nanoid(16)} offerData={e} />
					))}
				</tbody>
			</table>

			{!offers.length && !props.preloaderState && (
				<div className={styles.profile__table__message}>
					<div>
						{categoryState !== 'my-offers' ? <NoChatsIcon /> : <NoOffersIcon />}
						<p>No {categoryState !== 'my-offers' ? 'chats' : 'offers'}</p>
					</div>
				</div>
			)}

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

export default ProfileTable;
