import logoImg from '@/assets/images/UI/logo_block.svg';
import logoImgWhite from '@/assets/images/UI/logo_block_dark.svg';
import { ReactComponent as LogOutIcon } from '@/assets/images/UI/logout.svg';
import { ReactComponent as BurgerIcon } from '@/assets/images/UI/hamburger_icon.svg';
import { ReactComponent as BurgerCrossIcon } from '@/assets/images/UI/burger_cross.svg';
import React, { useRef, useState, useEffect, useContext } from 'react';
import { ReactComponent as EyeIcon } from '@/assets/images/UI/eye.svg';
import { ReactComponent as EyeCloseIcon } from '@/assets/images/UI/eye_close.svg';
import zanoIcon from '@/assets/images/UI/zano.svg';
import bitcoinWhiteIcon from '@/assets/images/UI/wbtc.svg';
import sunIcon from '@/assets/images/UI/sun_icon.svg';
import moonIcon from '@/assets/images/UI/moon_icon.svg';
import ethWhiteIcon from '@/assets/images/UI/weth.svg';
import customWhiteIcon from '@/assets/images/UI/tsds.svg';
import Link from 'next/link';
import Tooltip from '@/components/UI/Tooltip/Tooltip';
import Button from '@/components/UI/Button/Button';

import { useWindowWidth } from '@react-hook/window-size';
import ConnectButton from '@/components/UI/ConnectButton/ConnectButton';
import { notationToString, setWalletCredentials, shortenAddress } from '@/utils/utils';
import useAdvancedTheme from '@/hook/useTheme';

import { Store } from '@/store/store-reducer';
import { updateAutoClosedNotification, updateWalletState } from '@/store/actions';
import CurrencyCheckRowProps from '@/interfaces/props/components/default/Header/CurrencyCheckRowProps';
import Decimal from 'decimal.js';
import socket from '@/utils/socket';
import { OrderDataWithPair } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { useRouter } from 'next/router';
import zanoImg from '@/assets/images/UI/zano.svg';
import useUpdateUser from '@/hook/useUpdateUser';
import NavBar from './NavBar/NavBar';
import styles from './Header.module.scss';

function Header() {
	const { theme, setTheme } = useAdvancedTheme();
	const router = useRouter();

	const eyeRef = useRef<HTMLDivElement>(null);

	const { dispatch, state } = useContext(Store);
	const loggedIn = !!state.wallet?.connected;

	const [menuOpened, setMenuState] = useState(false);
	const [currencyCheckOpended, setCurrencyState] = useState(false);
	const [balanceSeen, setBalanceState] = useState(true);

	const width = useWindowWidth();

	useEffect(() => {
		setMenuState(false);
	}, [width]);

	function logout() {
		sessionStorage.removeItem('token');
		setWalletCredentials(undefined);
		updateWalletState(dispatch, null);
	}

	const getIcon = (ticker: string) => {
		switch (ticker) {
		case 'WBTC':
			return bitcoinWhiteIcon;
		case 'WETH':
			return ethWhiteIcon;
		default:
			return customWhiteIcon;
		}
	};

	function BurgerButton(props: { className?: string }) {
		return (
			<Button
				transparent
				className={`${styles.header__account__btn} ${styles.burger__tablet__btn} ${props.className}`}
				onClick={() => setMenuState(!menuOpened)}
			>
				{!menuOpened ? (
					<BurgerIcon className="filled" />
				) : (
					<BurgerCrossIcon className="filled" />
				)}
			</Button>
		);
	}

	function Menu(props: { isMobile?: boolean } = {}) {
		function CurrencyCheck() {
			function Row({ icon, title, amount, balanceSeen }: CurrencyCheckRowProps) {
				const [textHovered, setTextHovered] = useState(false);

				const displayedAmount = balanceSeen ? new Decimal(amount).toFixed() : '****';

				const showTooltip = displayedAmount.length >= 7;

				return (
					<div
						className={styles.currency__check__row}
						onMouseEnter={() => setTextHovered(true)}
						onMouseLeave={() => setTextHovered(false)}
					>
						<div className={styles.currency__check__icon}>
							<img src={icon} alt={title}></img>
						</div>
						<p className={styles.currency__title}>
							<span>{displayedAmount}</span> {title}
						</p>
						{showTooltip && (
							<Tooltip
								className={styles.currency__check__tooltip}
								shown={textHovered}
							>
								{displayedAmount}
							</Tooltip>
						)}
					</div>
				);
			}

			const assets = state.wallet?.connected ? state.wallet?.assets || [] : [];

			const openable = assets.length > 1;

			return (
				<div className={styles.header__currency__wrapper}>
					<div
						onClick={(e) => {
							if (e.target === eyeRef.current || !openable) return;
							setCurrencyState(!currencyCheckOpended);
						}}
						className={`${styles.header__currency__check} ${
							currencyCheckOpended ? styles.currency__check__opened : ''
						} ${openable ? styles.currency__check__openable : ''}`}
					>
						<Row
							balanceSeen={balanceSeen}
							icon={zanoIcon}
							title="ZANO"
							amount={Number(assets.find((e) => e.ticker === 'ZANO')?.balance) || 0}
						></Row>
						{/* <img 
                            onClick={() => setBalanceState(!balanceSeen)}
                            src={balanceSeen ? eyeCloseIcon : eyeIcon} alt="see"
                            style={!balanceSeen ? {opacity: "0.6"} : {}}
                        /> */}
						<div
							onClick={() => setBalanceState(!balanceSeen)}
							style={!balanceSeen ? { opacity: '0.6' } : {}}
							ref={eyeRef}
						>
							{balanceSeen ? (
								<EyeCloseIcon className="filled" />
							) : (
								<EyeIcon className="filled" />
							)}
						</div>
					</div>
					{currencyCheckOpended && (
						<div className={styles.currency__check__menu}>
							{assets
								?.filter((e) => e.ticker !== 'ZANO')
								.map((e) => (
									<Row
										key={e.ticker}
										balanceSeen={balanceSeen}
										icon={getIcon(e.ticker)}
										title={e.ticker}
										amount={Number(e.balance)}
									/>
								))}
						</div>
					)}
				</div>
			);
		}

		function ThemeButton(props: { className?: string }) {
			const [tooltipShown, setTooltipState] = useState(false);

			return (
				<div className={styles.theme__btn__wrapper}>
					<Button
						onMouseEnter={() => setTooltipState(true)}
						onMouseLeave={() => setTooltipState(false)}
						className={`${styles.theme__btn} ${props.className}`}
						onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
						transparent
					>
						<img src={theme === 'dark' ? sunIcon : moonIcon} alt="theme" />
					</Button>
					<Tooltip className={styles.theme__tooltip} shown={tooltipShown}>
						{theme === 'dark' ? 'Light' : 'Dark'} Theme
					</Tooltip>
				</div>
			);
		}

		return (
			<div
				className={`${styles.header__menu} ${props.isMobile ? styles.header__menu__mobile : ''}`}
			>
				<>
					{loggedIn ? (
						<div className={styles.header__account}>
							{CurrencyCheck()}
							<div className={styles.header__account__wrapper}>
								<div className={styles.header__account__info}>
									<p>
										{state.wallet?.connected && state.wallet.alias
											? `@${state.wallet.alias}`
											: '@no alias'}
									</p>
									<p>
										{state.wallet?.connected
											? shortenAddress(state.wallet.address || '')
											: '...'}
									</p>
								</div>
								<div className={styles.header__account__panel}>
									<div>
										<ThemeButton className={styles.header__account__btn} />
									</div>

									<Button
										onClick={logout}
										className={styles.header__account__btn}
										transparent={true}
									>
										<LogOutIcon className="stroked" />
									</Button>

									<BurgerButton />
								</div>
							</div>
						</div>
					) : (
						<div className={styles.header__login}>
							<ThemeButton />
							<ConnectButton autoAuth className={styles.header__connect_btn} />
							{!props.isMobile && <BurgerButton />}
						</div>
					)}
					{props.isMobile && <NavBar mobile />}
				</>
			</div>
		);
	}

	useEffect(() => {
		const token = sessionStorage.getItem('token');

		if (token) {
			socket.emit('in-dex-notifications', { token });

			return () => {
				socket.emit('out-dex-notifications', { token });
			};
		}
	}, [state.user?.address]);

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

					const pairLink = `/dex/trading/${pair.id}#my_orders`;

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
						console.log('Added notification with orderId:', orderData.id);

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
					console.log('Deleted notification with orderId:', orderId);
				}

				return newNotifications;
			});
		}

		if (state.closed_notifications.length > 0) {
			for (const notificationID of state.closed_notifications) {
				onCancel({ orderId: notificationID });
			}

			console.log('Closed notifications:', state.closed_notifications);

			updateAutoClosedNotification(dispatch, []);
		}

		socket.on('order-notification', onNotify);
		socket.on('order-notification-cancelation', onCancel);

		return () => {
			socket.off('order-notification', onNotify);
			socket.off('order-notification-cancelation', onCancel);
		};
	}, [state.user, activeNotifications, state.closed_notifications]);

	const mobileHeaderStyle: React.CSSProperties = {};

	if (!menuOpened) {
		mobileHeaderStyle.maxHeight = '0';
	} else if (currencyCheckOpended) {
		mobileHeaderStyle.overflow = 'inherit';
	}

	return (
		<>
			{menuOpened && <div className={styles.header__blur__block}></div>}
			<header className={styles.header}>
				<div className={styles.header__logo}>
					<Link href="/dex">
						<img src={theme === 'dark' ? logoImg : logoImgWhite} alt="Zano P2P" />
					</Link>
				</div>

				<div className={styles.header__desktop__navigation}>
					<NavBar />
				</div>
				{Menu()}
				<BurgerButton className={styles.header__burger} />

				<div className={styles.header__account__mobile} style={mobileHeaderStyle}>
					<div>
						<Menu isMobile={true} />
					</div>
				</div>
			</header>
		</>
	);
}

export default Header;
