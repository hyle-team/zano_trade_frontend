import styles from '@/styles/Home.module.scss';
import Header from '@/components/default/Header/Header';
import Marketplace from '@/pages/p2p/components/Marketplace/Marketplace';
import OffersIcon from '@/assets/images/UI/offers.svg';
import PlusIcon from '@/assets/images/UI/plus.svg';
import { useContext, useEffect, useState } from 'react';
import { getStats } from '@/utils/methods';
import Button from '@/components/UI/Button/Button';
import NotificationIndicator from '@/components/UI/NotificationIndicator/NotificationIndicator';
import { Store } from '@/store/store-reducer';
import Popup from '@/components/UI/Popup/Popup';
import CreateOfferPopup from '@/components/default/CreateOfferPopup/CreateOfferPopup';
import Link from 'next/link';
import MainPageTitle from '@/components/default/MainPageTitle/MainPageTitle';
import HomeProps from '@/interfaces/props/pages/p2p/HomeProps';
import OfferData from '@/interfaces/responses/offers/OfferData';
import { useRouter } from 'next/router';
import { Footer } from '@/zano_ui/src';

function Home(props: HomeProps) {
	const [offers, setOffers] = useState<OfferData[]>([]);
	const [popupShown, setPopupState] = useState(false);

	const { state } = useContext(Store);
	const router = useRouter();

	useEffect(() => {
		router.push('/404');
	}, [router]);

	const offersNotifications = state.user?.chats
		? state.user.chats?.filter(
				(e) => state.user?.id && !(e.view_list || [])?.includes(state.user?.id),
			).length || 0
		: 0;

	function Card(props: { title: string; value: string }) {
		return (
			<div className={styles.home__card}>
				<div>
					<p className={styles.home__card__title}>{props.title}</p>
					<p className={styles.home__card__value}>{props.value}</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<Header />
			<main className={styles.main}>
				<MainPageTitle
					blue="Sell Currency"
					white=" with Privacy"
					description="Peer-to-Peer Trading with Ionic Swaps"
				>
					<div className={styles.title__auth__buttons}>
						<div>
							<Button transparent onClick={() => setPopupState(true)}>
								<div>
									<PlusIcon className="stroked" />
									<p>New offer</p>
								</div>
							</Button>
						</div>

						<Link href="/p2p/profile">
							<Button transparent>
								<div>
									<OffersIcon className="storked" />
									<p>My offers</p>
								</div>

								<div className={styles.offers__notification__wrapper}>
									<NotificationIndicator count={offersNotifications} />
								</div>
							</Button>
						</Link>
					</div>
				</MainPageTitle>
				<div className={styles.cards__wrapper}>
					<Card title="Opened Contracts" value={`${props.stats?.opened}`} />
					<Card title="24 hours volume" value={`$ ${props.stats?.volume_24 || 0}`} />
					<Card title="7 days volume" value={`$ ${props.stats?.volume_7 || 0}`} />
					<Card title="30 days volume" value={`$ ${props.stats?.volume_30 || 0}`} />
				</div>

				<Marketplace value={offers} setValue={setOffers} />

				{popupShown && (
					<Popup
						settings={{ setPopupState }}
						Content={CreateOfferPopup}
						blur={true}
						close={() => setPopupState(false)}
						scroll={true}
					/>
				)}
			</main>
			<Footer className="no-svg-style" />
		</>
	);
}

export async function getServerSideProps() {
	const stats = await getStats();

	return {
		props: {
			stats: stats.data,
		},
	};
}

export default Home;
