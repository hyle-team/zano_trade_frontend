import styles from '@/styles/Profile.module.scss';
import Header from '@/components/default/Header/Header';
import Footer from '@/components/default/Footer/Footer';
import Dropdown from '@/components/UI/Dropdown/Dropdown';
import PageTitle from '@/components/default/PageTitle/PageTitle';
import DateRangeSelector from '@/components/UI/DateRangeSelector/DateRangeSelector';
import { useState, useContext, useEffect } from 'react';
import { Store } from '@/store/store-reducer';
import useUpdateUser from '@/hook/useUpdateUser';
import HorizontalSelect from '@/components/UI/HorizontalSelect/HorizontalSelect';
import CategoriesState from '@/interfaces/states/pages/p2p/profile/CategoriesState';
import FiltersState, { BuySell } from '@/interfaces/states/pages/p2p/profile/FiltersState';
import { UserChatData } from '@/interfaces/responses/user/GetUserRes';
import OffersStateElement from '@/interfaces/states/pages/p2p/profile/OffersState';
import ProfileTable from './ProfileTable/ProfileTable';

function Profile() {
	const { state } = useContext(Store);

	const fetchUser = useUpdateUser();

	useEffect(() => {
		fetchUser();
	}, []);

	const buySellValues: { name: BuySell }[] = [
		{
			name: 'Buy & Sell',
		},
		{
			name: 'Buy',
		},
		{
			name: 'Sell',
		},
	];

	const [offers, setOffers] = useState<OffersStateElement[]>(
		(state.user?.offers || []).map((e) => ({
			...e,
			alias: state.user?.alias || '',
			address: state.user?.address || '',
		})),
	);

	const [filters, setFilters] = useState<FiltersState>({
		buySell: buySellValues[0].name,
		date: {
			first: null,
			last: null,
		},
	});

	function getFilterFunction(code: 'chats' | 'active' | 'finished') {
		if (code === 'finished') {
			return (e: UserChatData) => e.status === 'finished';
		}
		if (code === 'active') {
			return (e: UserChatData) =>
				e.status !== 'finished' &&
				((e.owner_deposit && e.owner_deposit !== 'default') ||
					(e.opponent_deposit && e.opponent_deposit !== 'default'));
		}
		return (e: UserChatData) =>
			(e.owner_deposit === null || e.owner_deposit === 'default') &&
			(e.opponent_deposit === null || e.opponent_deposit === 'default');
	}

	const [notificationsAmount, setNotificationsAmount] = useState({
		chats: 0,
		active: 0,
		finished: 0,
	});

	const categories: CategoriesState[] = [
		{
			name: 'My offers',
			notifications: 0,
			code: 'my-offers',
		},
		{
			name: 'Chats',
			notifications: notificationsAmount.chats,
			code: 'chats',
		},
		{
			name: 'Active',
			notifications: notificationsAmount.active,
			code: 'active',
		},
		{
			name: 'Finished',
			notifications: notificationsAmount.finished,
			code: 'finished',
		},
	];

	const [categoryState, setCategoryState] = useState<CategoriesState>(categories[0]);

	useEffect(() => {
		const chatsWitnNotifications =
			state.user?.chats?.filter(
				(e) => state.user?.id && !(e.view_list || [])?.includes(state.user?.id),
			) || [];
		setNotificationsAmount({
			chats: chatsWitnNotifications.filter(getFilterFunction('chats')).length,
			active: chatsWitnNotifications.filter(getFilterFunction('active')).length,
			finished: chatsWitnNotifications.filter(getFilterFunction('finished')).length,
		});
	}, [state.user?.chats]);

	useEffect(() => {
		async function getOffers() {
			if (categoryState.code === 'my-offers') {
				setOffers(state.user?.offers || []);
			} else {
				setOffers(
					(state.user?.chats || [])
						.map((e) => ({
							...e,
							alias: e.creator_data.alias,
							address: e.creator_data.address,
						}))
						.filter(getFilterFunction(categoryState.code)),
				);
			}
		}

		getOffers();
	}, [categoryState, state.user?.offers, state.user?.chats]);

	// const [filterPopupState, setFilterState] = useState({name: "Buy & Sell"});

	function dateFilterFunc(e: OffersStateElement) {
		if (filters.date.first && filters.date.last) {
			const date = new Date(parseInt(e.timestamp, 10));
			const first = new Date(filters.date.first);
			const last = new Date(filters.date.last);

			first.setHours(0);
			first.setMinutes(0);
			first.setSeconds(0);
			first.setMilliseconds(0);

			last.setHours(24);
			last.setMinutes(0);
			last.setSeconds(0);
			last.setMilliseconds(0);

			return date.getTime() >= first.getTime() && date.getTime() <= last.getTime();
		}

		return true;
	}

	const filteredOffers = offers
		.filter((e) => {
			if (filters.buySell === 'Buy & Sell') {
				return true;
			}
			if (filters.buySell === 'Buy') {
				return e.type === 'buy';
			}
			if (filters.buySell === 'Sell') {
				return e.type === 'sell';
			}

			return false;
		})
		.filter(dateFilterFunc)
		.sort((a, b) => parseInt(b.timestamp, 10) - parseInt(a.timestamp, 10));
	return (
		<>
			<Header />
			<main className={styles.main}>
				<PageTitle>
					<h1>Offers</h1>
					<p className={styles.profile__title__description}>
						Check all the offers you have
					</p>
				</PageTitle>
				<div className={styles.profile__content}>
					<HorizontalSelect<CategoriesState>
						withNotifications
						body={categories}
						value={categoryState}
						setValue={setCategoryState}
					/>
					<div className={styles.profile__other_filters}>
						<Dropdown
							className={styles.profile__buy_sell__filter}
							selfContained
							value={{ name: filters.buySell }}
							setValue={(e) => {
								setFilters({ ...filters, buySell: e.name });
							}}
							body={buySellValues}
						></Dropdown>
						<DateRangeSelector
							value={filters.date}
							setValue={(e) => setFilters({ ...filters, date: e })}
						/>
					</div>
					{/* <Offers 
                        extended 
                        withEditor={categoryState.code === "my-offers"} 
                        offers={filteredOffers}
                        categoryState={categoryState.code}
                    /> */}
					<ProfileTable
						offers={filteredOffers || []}
						categoryState={categoryState.code}
					/>
				</div>
			</main>
			<Footer />
		</>
	);
}

export default Profile;
