import styles from '@/styles/User.module.scss';
import Header from '@/components/default/Header/Header';
import infoBlueIcon from '@/assets/images/UI/info_blue.svg?url';
import zanoIcon from '@/assets/images/UI/zano.svg?url';
import Offers from '@/components/default/Offers/Offers';
import BackButton from '@/components/default/BackButton/BackButton';
import { nanoid } from 'nanoid';
import { Footer } from '@/zano_ui/src';

function User() {
	// const userInfo = {
	// 	userName: 'test',
	// 	price: '0.00023',
	// 	limit: '1,000.00',
	// 	available: '321.12',
	// 	orders: '130',
	// 	completed: '90',
	// 	hash: 'ZxDCjt...6KQaR7',
	// };

	const userCharacteristics = [
		{
			title: 'Deals',
			value: '598 Time(s)',
			buying: '400',
			selling: '198',
		},
		{
			title: '30 days orders',
			value: '20 Time(s)',
		},
		{
			title: 'Comp. orders',
			value: '97.3%',
		},
		{
			title: 'Comp. orders in 30 days (%)',
			value: '100%',
		},
		{
			title: 'Avg. transfer time',
			value: '400 Min(s)',
		},
		{
			title: 'Avg. payment time',
			value: '0 Min(s)',
		},
	];

	const userBuyings = Array(3).fill({
		userName: 'test',
		price: '0.00023',
		limit: '1,000.00',
		available: '321.12',
		orders: '130',
		completed: '90',
		currency: 'Zano',
		currencyIcon: zanoIcon,
	});

	const userSelling = Array(3).fill({
		userName: 'test',
		price: '0.00023',
		limit: '1,000.00',
		available: '321.12',
		orders: '130',
		completed: '90',
		currency: 'Zano',
		currencyIcon: zanoIcon,
	});

	function UserCharacteristic(props) {
		const { characteristic } = props;

		return (
			<div className={styles.user__characteristic}>
				<div className={styles.characteristic__title__wrapper}>
					<p className={styles.user__characteristic__title}>{characteristic.title}</p>
					<img src={infoBlueIcon} alt="info"></img>
				</div>
				<p className={styles.user__characteristic__value}>{characteristic.value}</p>
				{characteristic.buying && characteristic.selling && (
					<div className={styles.user__characteristic__deals}>
						<p>Buying {characteristic.buying}</p>
						<p>Selling {characteristic.selling}</p>
					</div>
				)}
			</div>
		);
	}

	return (
		<>
			<Header />
			<main className={`${styles.main} with-separators`}>
				<div className={styles.user__header}>
					{/* <ProfileWidget offerData={userInfo}/> */}
					<BackButton />
				</div>
				<div className={styles.user__characteristics}>
					{userCharacteristics.map((e) => (
						<UserCharacteristic key={nanoid(16)} characteristic={e} />
					))}
				</div>
				<div className={styles.user__active_orders}>
					<h4>Active orders</h4>
					<div className={styles.user__buying}>
						<h4>Buying ({userBuyings.length})</h4>
						<Offers inUser={true} marketplaceBuyState={true} offers={userBuyings} />
					</div>

					<div className={styles.user__selling}>
						<h4>Selling ({userSelling.length})</h4>
						<Offers inUser={true} marketplaceBuyState={false} offers={userSelling} />
					</div>
				</div>
			</main>
			<Footer className="no-svg-style" />
		</>
	);
}

export default User;
