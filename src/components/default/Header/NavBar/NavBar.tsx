import { useRouter } from 'next/router';
import Link from 'next/link';
import { useContext } from 'react';
import SwapIcon from '@/assets/images/UI/swap_icon.svg';
import PersonsIcon from '@/assets/images/UI/persons_icon.svg';
import NotificationIndicator from '@/components/UI/NotificationIndicator/NotificationIndicator';
import NavItemProps from '@/interfaces/props/components/default/Header/NavBar/NavItemProps';
import NavBarProps from '@/interfaces/props/components/default/Header/NavBar/NavBarProps';
import { Store } from '@/store/store-reducer';
import { classes } from '@/utils/utils';
import styles from './NavBar.module.scss';

function NavBar({ mobile, onNavigate }: NavBarProps & { onNavigate?: () => void }) {
	const router = useRouter();
	const { state } = useContext(Store);
	const { wallet, user } = state;

	function NavItem({
		title,
		routeKeyphrase,
		href,
		Img,
		disabled,
		notifications,
		badge,
	}: NavItemProps) {
		const selected = router.route.includes(routeKeyphrase);

		const content = (
			<>
				<Img className={styles.nav__icon} />
				<span className={styles.nav__title}>{title}</span>
				{badge && <span className={styles.nav__soon}>{badge}</span>}
				<NotificationIndicator className={styles.badge} count={notifications} />
			</>
		);

		if (!selected && disabled) {
			return (
				<span aria-disabled="true" className={classes(styles.nav__item, styles.disabled)}>
					{content}
				</span>
			);
		}

		return (
			<Link
				href={href}
				onClick={onNavigate}
				className={classes(styles.nav__item, selected && styles.selected)}
			>
				{content}
			</Link>
		);
	}

	return (
		<nav className={classes(styles.nav, mobile ? styles.nav__mobile : styles.nav__desktop)}>
			<NavItem
				title="Swap"
				routeKeyphrase="swap"
				href="/dex"
				Img={SwapIcon}
				notifications={wallet?.connected ? user?.exchange_notifications || 0 : 0}
			/>
			<NavItem
				title="P2P Trading"
				routeKeyphrase="p2p"
				href="/p2p"
				Img={PersonsIcon}
				disabled
				badge="Soon"
			/>
		</nav>
	);
}

export default NavBar;
