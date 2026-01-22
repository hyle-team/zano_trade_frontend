import styles from '@/styles/Swap.module.scss';
import Header from '@/components/default/Header/Header';
import MainPageTitle from '@/components/default/MainPageTitle/MainPageTitle';
import HistoryIcon from '@/assets/images/UI/history_icon.svg';
import ExchangeIcon from '@/assets/images/UI/change_icon.svg';
import zanoWhiteIcon from '@/assets/images/UI/zano_white.svg?url';
import tickIcon from '@/assets/images/UI/tick_icon.svg?url';
import Link from 'next/link';
import Button from '@/components/UI/Button/Button';
import { nanoid } from 'nanoid';
import { useContext, useEffect, useState } from 'react';
import Input from '@/components/UI/Input/Input';
import { Store } from '@/store/store-reducer';
import { getFormattedCurrencies } from '@/utils/methods';
import ConnectButton from '@/components/UI/ConnectButton/ConnectButton';
import Dropdown from '@/components/UI/Dropdown/Dropdown';
import CurvePairChart from '@/components/UI/CurvePairChart/CurvePairChart';
import SwapItemProps from '@/interfaces/props/pages/swap/SwapItemProps';
import CurrencyRow from '@/interfaces/common/CurrencyRow';
import { useRouter } from 'next/router';
import { Footer } from '@/zano_ui/src';

function Swap() {
	const { state } = useContext(Store);
	const router = useRouter();

	const [currenciesElements, setCurrencies] = useState(
		getFormattedCurrencies(state.config?.currencies || []),
	);

	const [inputValue, setInputValue] = useState<CurrencyRow | null>(
		state.config?.currencies[0] || null,
	);
	const [targetValue, setTargetValue] = useState<CurrencyRow | null>(
		state.config?.currencies[0] || null,
	);

	useEffect(() => {
		const allCurrencies =
			state.config?.currencies?.filter((e) => e?.type === 'deposit' || e?.code === 'zano') ||
			[];

		const currencies = getFormattedCurrencies(allCurrencies);

		setCurrencies(currencies);
		setInputValue(allCurrencies[0] || null);
		setTargetValue(allCurrencies[0] || null);
	}, [state.config?.currencies]);

	useEffect(() => {
		router.push('/404');
	}, [router]);

	const items = [
		{
			name: 'Zano',
			code: 'ZANO',
			rate: '1.06',
			coefficient: 4.6,
		},
		{
			name: 'Wrapped Bitcoin',
			code: 'WBTC',
			rate: '1.06',
			coefficient: 4.6,
		},
		{
			name: 'Wrapped Ethereum',
			code: 'WETH',
			rate: '1.06',
			coefficient: -4.6,
		},
	];

	function SwapItem(props: SwapItemProps) {
		const { item } = props;

		return (
			<div className={styles.swap__item}>
				<div>
					<div>
						<img src={zanoWhiteIcon} alt="currency"></img>
					</div>
					<div className={styles.swap__item__description}>
						<h5>{item.name}</h5>
						<div>
							<h6>{item.code}/USD</h6>
							<p>
								${`${item.rate} `}
								<span
									style={{ color: item.coefficient > 0 ? '#16D1D6' : '#FF6767' }}
								>
									{item.coefficient > 0 ? '+' : ''}
									{item.coefficient}%
								</span>
							</p>
						</div>
					</div>
				</div>
				<CurvePairChart isAscending data={[]} className={styles.curve__chart} />
			</div>
		);
	}

	const [swapState, setSwapState] = useState(1); // 1, 2, 3

	return (
		<>
			<Header />
			<main className={styles.main}>
				<MainPageTitle
					blue="Easy"
					white=" Swap"
					description="Vivamus elementum mollis massa, maximus rhoncus risus aliquam non"
				>
					<Link href="/dex/orders">
						<Button className={styles.history__btn} transparent>
							<div>
								<HistoryIcon />
								<p>My Orders</p>
							</div>
						</Button>
					</Link>
				</MainPageTitle>

				<div className={styles.swap__panel__wrapper}>
					<div className={styles.swap__items__wrapper}>
						{items.map((e) => (
							<SwapItem key={nanoid(16)} item={e} />
						))}
					</div>
					<div className={styles.swap__process__wrapper}>
						<div className={styles.progress__bar__wrapper}>
							<div className={styles.progress__bar__background}>
								<div className={styles.progress__bar__markers}>
									<div className={styles.marker__selected}>
										<h6>1</h6>
										<h6>Exchange</h6>
									</div>
									<div className={swapState >= 2 ? styles.marker__selected : ''}>
										<h6>2</h6>
										<h6>Awaiting</h6>
									</div>
									<div className={swapState >= 3 ? styles.marker__selected : ''}>
										<h6>3</h6>
										<h6>Finish</h6>
									</div>
								</div>

								<div
									className={styles.progress__bar__filled}
									style={{
										width:
											swapState <= 3 && swapState >= 1
												? `${(swapState - 1) * 50}%`
												: '0%',
									}}
								></div>
							</div>
						</div>

						<div className={styles.swap__input__panel}>
							<div className={styles.swap__inputs__wrapper}>
								<div>
									<div className={styles.swap__labeled__input}>
										<h6>Sell</h6>
										<div>
											<Input placeholder="1" type="number" value={''} />
											<Dropdown
												className={styles.swap__input__dropdown}
												selfContained
												body={currenciesElements[0].data}
												value={inputValue || { name: '' }}
												setValue={setInputValue}
												withImages
											/>
										</div>
									</div>
									<div className={styles.exchange__icon}>
										<ExchangeIcon />
									</div>
									<div className={styles.swap__labeled__input}>
										<h6>Get</h6>
										<div>
											<Input
												placeholder="0.000034"
												type="number"
												value={''}
											/>
											<Dropdown
												className={styles.swap__input__dropdown}
												selfContained
												body={currenciesElements[0].data}
												value={targetValue || { name: '' }}
												setValue={setTargetValue}
												withImages
											/>
										</div>
									</div>
								</div>
								<div>
									<p>
										Fee: <span>0.01%</span>
									</p>
									<p>0.5 ZANO</p>
								</div>
							</div>

							<div className={styles.swap__button__wrapper}>
								{state.wallet?.connected && state.wallet?.address ? (
									<>
										{swapState === 1 && (
											<Button
												onClick={async () => {
													setSwapState(2);
													await new Promise((res) => {
														setTimeout(res, 2000);
													});
													setSwapState(3);
												}}
											>
												Swap
											</Button>
										)}
										{swapState === 2 && (
											<div>
												{/* <Preloader className={styles.swap__button__preloader}/> */}
												<p>Exchange...</p>
											</div>
										)}
										{swapState !== 1 && swapState !== 2 && (
											<>
												<div>
													<img src={tickIcon} alt="ready" />
													<p className={styles.swap__button__ready}>
														Ready!
													</p>
												</div>
												<Link
													href="/"
													onClick={(e) => {
														e.preventDefault();
														setSwapState(1);
													}}
												>
													Swap more...
												</Link>
											</>
										)}
									</>
								) : (
									<ConnectButton />
								)}
							</div>
						</div>
					</div>
				</div>
			</main>
			<Footer className="no-svg-style" />
		</>
	);
}

export default Swap;
