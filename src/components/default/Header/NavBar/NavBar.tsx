import { useRouter } from 'next/router';
import Link from 'next/link';

import { ReactComponent as TradeIcon } from '@/assets/images/UI/trade_icon.svg';
import { ReactComponent as SwapIcon } from '@/assets/images/UI/swap_icon.svg';
import { ReactComponent as PersonsIcon } from '@/assets/images/UI/persons_icon.svg';
import NavItemProps from '@/interfaces/props/components/default/Header/NavBar/NavItemProps';
import NavBarProps from '@/interfaces/props/components/default/Header/NavBar/NavBarProps';
import NotificationIndicator from '@/components/UI/NotificationIndicator/NotificationIndicator';
import { useContext } from 'react';
import { Store } from '@/store/store-reducer';
import styles from './NavBar.module.scss';

function NavBar(props: NavBarProps) {
	const router = useRouter();

	const { state } = useContext(Store);

	const { wallet, user } = state;

	function NavItem(props: NavItemProps) {
		const { routeKeyphrase } = props;
		const { title } = props;
		const { href } = props;
		const { Img } = props;
		const { disabled } = props;
		const { notifications } = props;
		// const ImgSelected = props.imgSelected;

		const selected = router.route.includes(routeKeyphrase);
		let linkClass = '';

		if (selected) {
			linkClass = styles.selected;
		} else if (disabled) {
			linkClass = styles.disabled;
		}

		return (
			<Link href={href} className={linkClass}>
				<Img />
				<h6>{title}</h6>
				<NotificationIndicator count={notifications} />
			</Link>
		);
	}

	return (
		<nav
			className={`${styles.nav} ${!props.mobile ? styles.nav__desktop : styles.nav__mobile}`}
		>
			<NavItem
				title={'Exchange'}
				routeKeyphrase={'dex'}
				href={'/dex'}
				Img={TradeIcon}
				notifications={wallet?.connected ? user?.exchange_notifications || 0 : 0}
			/>
			<NavItem
				title={'Swap'}
				routeKeyphrase={'swap'}
				href={'/swap'}
				Img={SwapIcon}
				disabled
			/>
			<NavItem
				title={'P2P Trading'}
				routeKeyphrase={'p2p'}
				href={'/p2p'}
				Img={PersonsIcon}
				disabled
			/>
		</nav>
	);
}

export default NavBar;
