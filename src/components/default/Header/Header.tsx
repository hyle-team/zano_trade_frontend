import logoImg from '@/assets/images/UI/logo_block.svg?url';
import logoImgWhite from '@/assets/images/UI/logo_block_dark.svg?url';
import React, { useRef, useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Decimal from 'decimal.js';

import ConnectButton from '@/components/UI/ConnectButton/ConnectButton';
import TokenIcon from '@/components/UI/TokenIcon';
import {
	ChevronDownIcon,
	EyeIcon,
	EyeOffIcon,
	LogoutIcon,
	ThemeIcon,
	UserIcon,
} from '@/components/UI/Icons';
import { classes, notationToString, shortenAddress, ZANO_ASSET_ID } from '@/utils/utils';
import { formatTokenAmount } from '@/utils/swap';
import { figtree } from '@/utils/font';
import useAdvancedTheme from '@/hook/useTheme';
import { Store } from '@/store/store-reducer';
import { updateAutoClosedNotification, updateToken, updateWalletState } from '@/store/actions';
import socket from '@/utils/socket';
import { OrderDataWithPair } from '@/interfaces/responses/orders/GetOrdersPageRes';
import zanoImg from '@/assets/images/UI/zano.svg?url';
import useUpdateUser from '@/hook/useUpdateUser';
import { getDexOrderHref, getStoredDexMode } from '@/utils/dexMode';
import NavBar from './NavBar/NavBar';
import styles from './Header.module.scss';

function useOutsideClick(ref: React.RefObject<HTMLElement>, onOutside: () => void) {
	useEffect(() => {
		function onMouseDown(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
		}

		document.addEventListener('mousedown', onMouseDown);
		return () => document.removeEventListener('mousedown', onMouseDown);
	}, [ref, onOutside]);
}

function Header({ isLg }: { isLg?: boolean }) {
	const { theme, setTheme } = useAdvancedTheme();
	const router = useRouter();

	const { dispatch, state } = useContext(Store);
	const loggedIn = !!state.wallet?.connected;

	const [menuOpened, setMenuOpened] = useState(false);
	const [balancesOpened, setBalancesOpened] = useState(false);
	const [balanceSeen, setBalanceSeen] = useState(true);

	const balancesRef = useRef<HTMLDivElement>(null);
	useOutsideClick(balancesRef, () => setBalancesOpened(false));

	useEffect(() => {
		setMenuOpened(false);
	}, [router.asPath]);

	function logout() {
		updateToken(dispatch, null);
		updateWalletState(dispatch, null);
	}

	useEffect(() => {
		if (state.token) {
			socket.emit('in-dex-notifications', { token: state.token });

			return () => {
				socket.emit('out-dex-notifications', { token: state.token });
			};
		}
	}, [state.user?.address, state.token]);

	const [activeNotifications, setActiveNotifications] = useState(
		new Map<number, { Notification: Notification; orderData: OrderDataWithPair }>(),
	);

	const fetchUser = useUpdateUser();

	useEffect(() => {
		function onNotify({ orderData }: { orderData: OrderDataWithPair }) {
			if (state.user) {
				fetchUser();
				if (!!('Notification' in window) && Notification.permission === 'granted') {
					const { pair } = orderData;

					const pairLink = getDexOrderHref(getStoredDexMode(), pair.id);

					const notification = new Notification('Zano Trade - New offer', {
						body: `You have new offer: ${orderData.type === 'buy' ? 'Buy' : 'Sell'} | ${
							pair.first_currency.name
						}/${pair.second_currency.name} | Price: ${notationToString(
							orderData.price,
						)}`,
						icon: zanoImg,
					});

					notification.onclick = () => {
						router.push(pairLink);
					};

					setActiveNotifications((prevNotifications) => {
						const newNotifications = new Map(prevNotifications);

						newNotifications.set(parseInt(orderData.id, 10), {
							Notification: notification,
							orderData,
						});
						return newNotifications;
					});
				}
			}
		}

		function onCancel({ orderId }: { orderId: number }) {
			fetchUser();
			setActiveNotifications((prevNotifications) => {
				const newNotifications = new Map(prevNotifications);
				const notification = newNotifications.get(orderId);

				if (notification) {
					notification.Notification.close();
					newNotifications.delete(orderId);
				}

				return newNotifications;
			});
		}

		if (state.closed_notifications.length > 0) {
			for (const notificationID of state.closed_notifications) {
				onCancel({ orderId: notificationID });
			}

			updateAutoClosedNotification(dispatch, []);
		}

		socket.on('order-notification', onNotify);
		socket.on('order-notification-cancelation', onCancel);

		return () => {
			socket.off('order-notification', onNotify);
			socket.off('order-notification-cancelation', onCancel);
		};
	}, [state.user, activeNotifications, state.closed_notifications]);

	const assets = loggedIn ? state.wallet?.assets || [] : [];
	const zanoAsset = assets.find((e) => e.assetId === ZANO_ASSET_ID);
	const otherAssets = assets.filter((e) => e.assetId !== ZANO_ASSET_ID);

	const displayBalance = (amount: string | number | undefined) => {
		if (!balanceSeen) return '****';
		try {
			return formatTokenAmount(new Decimal(amount || 0).toFixed(), 4);
		} catch {
			return '0';
		}
	};

	const alias = state.wallet?.alias ? `@${state.wallet.alias}` : '@no alias';
	const address = shortenAddress(state.wallet?.address || '');

	const themeButton = (
		<button
			className={styles.iconBtn}
			onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
			aria-label={theme === 'dark' ? 'Light theme' : 'Dark theme'}
			title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
		>
			<ThemeIcon />
		</button>
	);

	const balances = (
		<div className={styles.balances} ref={balancesRef}>
			<button
				className={classes(styles.chip, balancesOpened && styles.chip__active)}
				onClick={() => setBalancesOpened((prev) => !prev)}
			>
				<TokenIcon assetId={ZANO_ASSET_ID} size={22} />
				<span className={styles.chip__value}>
					{displayBalance(zanoAsset?.balance)} <em>ZANO</em>
				</span>
				<ChevronDownIcon className={styles.chip__chevron} />
			</button>

			<div className={classes(styles.dropdown, balancesOpened && styles.dropdown__open)}>
				<div className={styles.dropdown__head}>
					<p>Wallet balances</p>
					<button
						className={styles.dropdown__eye}
						onClick={() => setBalanceSeen((prev) => !prev)}
						aria-label={balanceSeen ? 'Hide balances' : 'Show balances'}
					>
						{balanceSeen ? <EyeOffIcon /> : <EyeIcon />}
					</button>
				</div>
				{[zanoAsset, ...otherAssets].filter(Boolean).map((asset) => (
					<div key={asset?.assetId} className={styles.dropdown__item}>
						<TokenIcon assetId={asset?.assetId} size={24} />
						<p>{asset?.ticker}</p>
						<span>{displayBalance(asset?.balance)}</span>
					</div>
				))}
				{!assets.length && <p className={styles.dropdown__empty}>No assets</p>}
			</div>
		</div>
	);

	const account = (
		<div className={styles.account}>
			<span className={styles.account__avatar}>
				<UserIcon />
			</span>
			<div className={styles.account__info}>
				<p>{alias}</p>
				<span>{address}</span>
			</div>
		</div>
	);

	return (
		<header
			className={classes(styles.header, isLg && styles.lg, figtree.variable, 'no-svg-style')}
		>
			<div className={styles.header__bar}>
				<div className={styles.header__main}>
					<Link href="/dex" className={styles.header__logo}>
						<img src={theme === 'dark' ? logoImg : logoImgWhite} alt="Zano Trade" />
					</Link>

					<div className={styles.header__nav}>
						<NavBar />
					</div>
				</div>

				<div className={styles.header__actions}>
					{loggedIn ? (
						<>
							<div className={styles.header__desktopOnly}>{balances}</div>
							<div className={styles.header__desktopOnly}>{account}</div>
							{themeButton}
							<button
								className={classes(styles.iconBtn, styles.header__desktopOnly)}
								onClick={logout}
								aria-label="Log out"
								title="Log out"
							>
								<LogoutIcon width={20} height={20} />
							</button>
						</>
					) : (
						<>
							{themeButton}
							<ConnectButton
								autoAuth
								className={classes(styles.connect, styles.header__desktopOnly)}
							/>
						</>
					)}

					<button
						className={styles.burger}
						onClick={() => setMenuOpened((prev) => !prev)}
						aria-label={menuOpened ? 'Close menu' : 'Open menu'}
						aria-expanded={menuOpened}
					>
						<span
							className={classes(styles.burger__lines, menuOpened && styles.active)}
						>
							<span />
							<span />
							<span />
						</span>
					</button>
				</div>
			</div>

			<div className={classes(styles.mobile, menuOpened && styles.mobile__open)}>
				<NavBar mobile onNavigate={() => setMenuOpened(false)} />

				<div className={styles.mobile__account}>
					{loggedIn ? (
						<>
							{account}
							<div className={styles.mobile__balances}>
								{[zanoAsset, ...otherAssets].filter(Boolean).map((asset) => (
									<div key={asset?.assetId} className={styles.dropdown__item}>
										<TokenIcon assetId={asset?.assetId} size={24} />
										<p>{asset?.ticker}</p>
										<span>{displayBalance(asset?.balance)}</span>
									</div>
								))}
							</div>
							<button className={styles.mobile__logout} onClick={logout}>
								<LogoutIcon />
								Log out
							</button>
						</>
					) : (
						<ConnectButton autoAuth className={styles.mobile__connect} />
					)}
				</div>
			</div>
		</header>
	);
}

export default Header;
