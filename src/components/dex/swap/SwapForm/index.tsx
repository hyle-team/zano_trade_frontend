import Decimal from 'decimal.js';
import { useContext, useEffect, useMemo, useState } from 'react';
import { validateTokensInput } from 'shared/utils';

import ConnectButton from '@/components/UI/ConnectButton/ConnectButton';
import Button from '@/components/UI/Button/Button';
import TooltipWrapper from '@/components/UI/TooltipWrapper';
import SegmentedTabs from '@/components/UI/SegmentedTabs';
import TokenIcon from '@/components/UI/TokenIcon';
import QuoteSelect from '@/components/dex/swap/QuoteSelect';
import { ChevronDownIcon, InfoIcon, SwapArrowsIcon } from '@/components/UI/Icons';
import { Store } from '@/store/store-reducer';
import { useAlert } from '@/hook/useAlert';
import { createOrder, getAssetExplorerPrice } from '@/utils/methods';
import { classes, isPositiveFloatStr, ZANO_ASSET_ID } from '@/utils/utils';
import {
	SWAP_FEE_ZANO,
	formatTokenAmount,
	formatUsd,
	getAvailableLiquidity,
	getMarketPrice,
	safeDecimal,
} from '@/utils/swap';
import PairData from '@/interfaces/common/PairData';
import OfferType from '@/interfaces/common/OfferType';
import OrderRow from '@/interfaces/common/OrderRow';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import styles from './styles.module.scss';

type PriceMode = 'limit' | 'market';
type Field = 'pay' | 'receive';

const MAX_ORDERS_PER_SIDE = 10;
const MAX_ORDER_VALUE = 1000000000;

interface SwapFormProps {
	pairData: PairData | null;
	pairStats: PairStats | null;
	orderBook: PageOrderData[];
	userOrders: OrderRow[];
	side: OfferType;
	onSideChange: (_side: OfferType) => void;
	onOpenAssetSelect: () => void;
	onOrderCreated: (_order: OrderRow & { immediateMatch?: boolean }) => void;
	loading?: boolean;
}

function sanitizeInput(value: string) {
	return value.replace(',', '.').replace(/^0+(?=\d)/, '');
}

const SwapForm = ({
	pairData,
	pairStats,
	orderBook,
	userOrders,
	side,
	onSideChange,
	onOpenAssetSelect,
	onOrderCreated,
	loading,
}: SwapFormProps) => {
	const { state } = useContext(Store);
	const { setAlertState, setAlertSubtitle } = useAlert();

	const [priceMode, setPriceMode] = useState<PriceMode>('market');
	const [limitPrice, setLimitPrice] = useState('');
	const [editedField, setEditedField] = useState<Field>('pay');
	const [editedValue, setEditedValue] = useState('');
	const [manualValues, setManualValues] = useState<Record<Field, string>>({
		pay: '',
		receive: '',
	});
	const [explorerPrice, setExplorerPrice] = useState<{
		assetId: string;
		price: string;
		loading: boolean;
	} | null>(null);
	const [creating, setCreating] = useState(false);

	const isBuy = side === 'buy';
	const loggedIn = !!state.wallet?.connected;
	const ownAddress = state.wallet?.address;

	const token = pairData?.first_currency;
	const tokenTicker = token?.name || 'token';
	const tokenAssetId = token?.asset_id || '';
	const amountDP = token?.asset_info?.decimal_point ?? 12;
	const priceDP = pairData?.second_currency?.asset_info?.decimal_point ?? 12;

	const zanoUsd = state.assetsRates.get(ZANO_ASSET_ID);

	const assets = loggedIn ? state.wallet?.assets || [] : [];
	const tokenBalance = assets.find((a) => a.assetId === tokenAssetId)?.balance ?? '0';
	const zanoBalance = assets.find((a) => a.assetId === ZANO_ASSET_ID)?.balance ?? '0';

	const bookMarket = useMemo(
		() => getMarketPrice(orderBook, side, pairStats?.rate ?? pairData?.rate, ownAddress),
		[orderBook, side, pairStats?.rate, pairData?.rate, ownAddress],
	);

	const isWhitelisted = !!(pairData?.whitelisted || pairData?.first_currency?.whitelisted);
	const needsExplorerPrice = isWhitelisted && !!tokenAssetId && !bookMarket.price;

	useEffect(() => {
		if (!needsExplorerPrice) return undefined;

		let cancelled = false;

		setExplorerPrice({ assetId: tokenAssetId, price: '', loading: true });

		getAssetExplorerPrice(tokenAssetId)
			.then((res) => {
				if (cancelled) return;
				const zanoPrice = safeDecimal(res?.data?.zano_price ?? 0);
				setExplorerPrice({
					assetId: tokenAssetId,
					price:
						res?.success && zanoPrice.gt(0)
							? zanoPrice.toDecimalPlaces(priceDP, Decimal.ROUND_DOWN).toFixed()
							: '',
					loading: false,
				});
			})
			.catch(() => {
				if (!cancelled)
					setExplorerPrice({ assetId: tokenAssetId, price: '', loading: false });
			});

		return () => {
			cancelled = true;
		};
	}, [needsExplorerPrice, tokenAssetId, priceDP]);

	const explorerReady = explorerPrice?.assetId === tokenAssetId && !explorerPrice.loading;
	const explorerMarketPrice = needsExplorerPrice && explorerReady ? explorerPrice.price : '';
	const marketPriceLoading =
		priceMode === 'market' && (!!loading || (needsExplorerPrice && !explorerReady));
	const marketPrice = bookMarket.price || explorerMarketPrice;
	const marketSource = (() => {
		if (bookMarket.price) {
			return bookMarket.fromOrderBook
				? `Best ${isBuy ? 'ask' : 'bid'} in order book`
				: 'Last trade price';
		}
		return explorerMarketPrice ? 'Zano Explorer price' : null;
	})();

	useEffect(() => {
		setEditedValue('');
		setLimitPrice('');
		setManualValues({ pay: '', receive: '' });
	}, [pairData?.id]);

	const noMarketPrice =
		priceMode === 'market' && !!pairData && !marketPrice && !marketPriceLoading;
	const price = priceMode === 'market' ? marketPrice : limitPrice;
	const priceDecimal = safeDecimal(price);
	const priceValid = !!price && validateTokensInput(price, priceDP).valid && priceDecimal.gt(0);

	const tokenField: Field = isBuy ? 'receive' : 'pay';
	const zanoField: Field = isBuy ? 'pay' : 'receive';

	const { amount, total } = useMemo(() => {
		const value = safeDecimal(editedValue);
		const tokenSideEdited = (editedField === 'receive') === isBuy;

		if (!priceValid && priceMode === 'limit') {
			return tokenSideEdited
				? { amount: editedValue, total: manualValues[zanoField] }
				: { amount: manualValues[tokenField], total: editedValue };
		}

		if (!editedValue || value.isZero()) return { amount: '', total: '' };

		if (tokenSideEdited) {
			return {
				amount: editedValue,
				total: priceValid
					? value.mul(priceDecimal).toDecimalPlaces(priceDP, Decimal.ROUND_DOWN).toFixed()
					: '',
			};
		}

		if (!priceValid) return { amount: '', total: editedValue };

		const derivedAmount = value.div(priceDecimal).toDecimalPlaces(amountDP, Decimal.ROUND_DOWN);

		return {
			amount: derivedAmount.gt(0) ? derivedAmount.toFixed() : '',
			total: derivedAmount
				.mul(priceDecimal)
				.toDecimalPlaces(priceDP, Decimal.ROUND_DOWN)
				.toFixed(),
		};
	}, [
		editedValue,
		editedField,
		isBuy,
		priceValid,
		price,
		priceMode,
		manualValues,
		amountDP,
		priceDP,
	]);

	const zanoValue = editedField === (isBuy ? 'pay' : 'receive') ? editedValue : total;
	const tokenValue = editedField === (isBuy ? 'receive' : 'pay') ? editedValue : amount;
	const payValue = isBuy ? zanoValue : tokenValue;
	const receiveValue = isBuy ? tokenValue : zanoValue;

	const payBalance = isBuy ? zanoBalance : tokenBalance;
	const receiveBalance = isBuy ? tokenBalance : zanoBalance;
	const payTicker = isBuy ? 'ZANO' : tokenTicker;
	const receiveTicker = isBuy ? tokenTicker : 'ZANO';
	const payDP = isBuy ? priceDP : amountDP;
	const receiveDP = isBuy ? amountDP : priceDP;

	const amountDecimal = safeDecimal(amount);
	const totalDecimal = safeDecimal(total);

	const insufficientBalance =
		loggedIn &&
		(isBuy
			? totalDecimal.plus(SWAP_FEE_ZANO).gt(safeDecimal(zanoBalance)) && totalDecimal.gt(0)
			: amountDecimal.gt(safeDecimal(tokenBalance)) ||
				safeDecimal(SWAP_FEE_ZANO).gt(safeDecimal(zanoBalance)));

	const amountValid = !!amount && validateTokensInput(amount, amountDP).valid;
	const totalValid = !!total && totalDecimal.gt(0);

	const sameSideOrders = userOrders.filter((o) => o.type === side).length;
	const tooManyOrders = sameSideOrders >= MAX_ORDERS_PER_SIDE;

	const liquidity = useMemo(
		() =>
			priceValid ? getAvailableLiquidity(orderBook, side, price, ownAddress) : new Decimal(0),
		[orderBook, side, price, priceValid, ownAddress],
	);

	const usdOf = (zanoAmount: Decimal) => (zanoUsd ? zanoAmount.mul(zanoUsd) : null);
	const payUsd = formatUsd(isBuy ? usdOf(safeDecimal(payValue)) : usdOf(totalDecimal));
	const receiveUsd = formatUsd(isBuy ? usdOf(totalDecimal) : usdOf(safeDecimal(receiveValue)));

	const marketDeviation = useMemo(() => {
		if (priceMode !== 'limit' || !priceValid || !marketPrice) return null;
		const marketDecimal = safeDecimal(marketPrice);
		if (marketDecimal.isZero()) return null;
		return priceDecimal.minus(marketDecimal).div(marketDecimal).mul(100);
	}, [priceMode, priceValid, price, marketPrice]);

	function onFieldInput(field: Field, raw: string, dp: number) {
		const value = sanitizeInput(raw);
		if (value !== '' && !isPositiveFloatStr(value)) return;
		if ((value.split('.')[1]?.length ?? 0) > dp) return;
		if (value.replace('.', '').length > 20) return;

		const otherField: Field = field === 'pay' ? 'receive' : 'pay';
		const otherValue = manualValues[otherField];

		setManualValues((prev) => ({ ...prev, [field]: value }));
		setEditedField(field);
		setEditedValue(value);

		if (priceMode !== 'limit' || priceValid) return;

		const tokenValue = safeDecimal(field === tokenField ? value : otherValue);
		const zanoValue = safeDecimal(field === zanoField ? value : otherValue);

		if (tokenValue.gt(0) && zanoValue.gt(0)) {
			const derivedPrice = zanoValue
				.div(tokenValue)
				.toDecimalPlaces(priceDP, Decimal.ROUND_DOWN);
			if (derivedPrice.gt(0)) setLimitPrice(derivedPrice.toFixed());
		}
	}

	function onPriceInput(raw: string) {
		const value = sanitizeInput(raw);
		if (value !== '' && !isPositiveFloatStr(value)) return;
		if ((value.split('.')[1]?.length ?? 0) > priceDP) return;
		setLimitPrice(value);
	}

	function onMax() {
		let max = safeDecimal(payBalance);
		if (isBuy) max = max.minus(SWAP_FEE_ZANO);
		if (max.lte(0)) return;

		const maxValue = max.toDecimalPlaces(payDP, Decimal.ROUND_DOWN).toFixed();
		setManualValues((prev) => ({ ...prev, pay: maxValue }));
		setEditedField('pay');
		setEditedValue(maxValue);
	}

	function onFlip() {
		onSideChange(isBuy ? 'sell' : 'buy');
		setEditedField(editedField === 'pay' ? 'receive' : 'pay');
		setManualValues((prev) => ({ pay: prev.receive, receive: prev.pay }));
	}

	function onModeChange(mode: PriceMode) {
		if (mode === 'limit' && !limitPrice && marketPrice) {
			setLimitPrice(
				safeDecimal(marketPrice).toDecimalPlaces(priceDP, Decimal.ROUND_DOWN).toFixed(),
			);
		}
		setPriceMode(mode);
	}

	function showError(message: string) {
		setAlertState('error');
		setAlertSubtitle(message);
		setTimeout(() => {
			setAlertState(null);
			setAlertSubtitle('');
		}, 3000);
	}

	async function onCreate() {
		if (!pairData) return;

		if (amountDecimal.gte(MAX_ORDER_VALUE) || priceDecimal.gte(MAX_ORDER_VALUE)) {
			showError('Amount or price is too big');
			return;
		}

		setCreating(true);

		try {
			const result = await createOrder(
				{
					type: side,
					side: 'limit',
					price: priceDecimal.toFixed(),
					amount: amountDecimal.toFixed(),
					pairId: String(pairData.id),
				},
				{ token: state.token },
			);

			if (!result.success) {
				const messages: Record<string, string> = {
					'Same order': 'You already have the same order',
					'Too many orders': 'Too many open orders for this asset and side',
				};
				showError(messages[result.data] || 'Failed to create order');
				return;
			}

			setEditedValue('');
			setManualValues({ pay: '', receive: '' });
			onOrderCreated(result.data);
		} catch (error) {
			console.error(error);
			showError('Failed to create order');
		} finally {
			setCreating(false);
		}
	}

	const ctaLabel = (() => {
		if (!pairData) return 'Select an asset';
		if (!priceValid) return priceMode === 'limit' ? 'Enter a price' : 'No market price';
		if (!editedValue || amountDecimal.isZero()) return 'Enter an amount';
		if (!amountValid || !totalValid) return 'Amount is too small';
		if (insufficientBalance) return `Insufficient ${isBuy ? 'ZANO' : tokenTicker} balance`;
		if (tooManyOrders) return 'Too many open orders';
		return isBuy ? `Buy ${tokenTicker}` : `Sell ${tokenTicker}`;
	})();

	const canCreate =
		!!pairData &&
		priceValid &&
		amountValid &&
		totalValid &&
		!insufficientBalance &&
		!tooManyOrders &&
		!loading &&
		!creating;

	const renderTokenButton = (isToken: boolean) =>
		isToken ? (
			<button className={styles.token} onClick={onOpenAssetSelect} disabled={loading}>
				{tokenAssetId && <TokenIcon assetId={tokenAssetId} size={26} />}
				<span>{token?.name || 'Select asset'}</span>
				<ChevronDownIcon />
			</button>
		) : (
			<QuoteSelect />
		);

	const liquidityNotice = (() => {
		if (!priceValid || !amountValid) return null;

		if (liquidity.isZero()) {
			return (
				<>
					No matching orders are available at this price right now. Your order will remain
					open until it&apos;s matched or you close this page.
				</>
			);
		}

		if (amountDecimal.gt(liquidity)) {
			return (
				<>
					Only {formatTokenAmount(liquidity, amountDP)} {tokenTicker} is available at this
					price now. The rest will wait for a match.
				</>
			);
		}

		return null;
	})();

	const inputsDisabled = !pairData || noMarketPrice || marketPriceLoading;

	const renderField = (field: Field) => {
		const isPay = field === 'pay';

		return (
			<div className={classes(styles.field, inputsDisabled && styles.field__disabled)}>
				<div className={styles.field__top}>
					<p className={styles.field__label}>{isPay ? 'You pay' : 'You receive'}</p>
					{loggedIn && (
						<p className={styles.field__balance}>
							Balance: {formatTokenAmount(isPay ? payBalance : receiveBalance, 6)}{' '}
							{isPay ? payTicker : receiveTicker}
							{isPay && (
								<button
									className={styles.field__max}
									onClick={onMax}
									disabled={inputsDisabled}
								>
									MAX
								</button>
							)}
						</p>
					)}
				</div>

				<div className={styles.field__row}>
					<input
						className={styles.field__input}
						inputMode="decimal"
						placeholder="0"
						disabled={inputsDisabled}
						value={isPay ? payValue : receiveValue}
						onChange={(e) =>
							onFieldInput(field, e.target.value, isPay ? payDP : receiveDP)
						}
					/>
					{renderTokenButton(isPay ? !isBuy : isBuy)}
				</div>
				<p className={styles.field__usd}>{(isPay ? payUsd : receiveUsd) ?? ' '}</p>
			</div>
		);
	};

	const flipButton = (
		<div className={styles.flip}>
			<TooltipWrapper
				placement="top"
				text={isBuy ? `Switch to sell ${tokenTicker}` : `Switch to buy ${tokenTicker}`}
			>
				<button className={styles.flip__btn} onClick={onFlip} aria-label="Switch direction">
					<SwapArrowsIcon />
				</button>
			</TooltipWrapper>
		</div>
	);

	const priceField = (
		<div className={styles.price}>
			<div className={styles.field__top}>
				<p className={styles.field__label}>
					Price per {tokenTicker}
					{marketDeviation && !marketDeviation.isZero() && (
						<span
							className={classes(
								styles.deviation,
								marketDeviation.gt(0) === isBuy
									? styles.deviation__bad
									: styles.deviation__good,
							)}
						>
							{marketDeviation.gt(0) ? '+' : ''}
							{marketDeviation.toFixed(2)}% vs market
						</span>
					)}
				</p>

				{marketPrice && (
					<button
						className={styles.field__max}
						onClick={() =>
							setLimitPrice(
								safeDecimal(marketPrice)
									.toDecimalPlaces(priceDP, Decimal.ROUND_DOWN)
									.toFixed(),
							)
						}
					>
						Use market
					</button>
				)}
			</div>

			<div className={styles.field__row}>
				<input
					className={classes(styles.field__input, styles.price__input)}
					inputMode="decimal"
					placeholder="0"
					disabled={!pairData}
					value={limitPrice}
					onChange={(e) => onPriceInput(e.target.value)}
				/>
				<span className={styles.price__unit}>ZANO</span>
			</div>
		</div>
	);

	const renderAction = () => {
		if (!pairData) {
			return (
				<Button variant="primary" block onClick={onOpenAssetSelect} disabled={loading}>
					Select an asset
				</Button>
			);
		}

		if (marketPriceLoading) {
			return (
				<Button variant="primary" block disabled loading>
					Loading market price...
				</Button>
			);
		}

		if (noMarketPrice) {
			return (
				<Button variant="primary" block onClick={() => onModeChange('limit')}>
					Switch to limit
				</Button>
			);
		}

		if (!loggedIn) return <ConnectButton className={styles.connect} />;

		return (
			<Button
				variant="primary"
				block
				disabled={!canCreate}
				loading={creating}
				onClick={onCreate}
			>
				{creating ? 'Creating order...' : ctaLabel}
			</Button>
		);
	};

	return (
		<div className={styles.form}>
			<div className={styles.form__head}>
				<h2 className={styles.form__title}>Swap</h2>

				<SegmentedTabs<PriceMode>
					size="sm"
					value={priceMode}
					onChange={onModeChange}
					tabs={[
						{ value: 'limit', label: 'Limit' },
						{ value: 'market', label: 'Market' },
					]}
				/>
			</div>

			<div className={styles.fields}>
				{renderField('pay')}
				{flipButton}
				{priceMode === 'limit' && priceField}
				{renderField('receive')}
			</div>

			{noMarketPrice ? (
				<div className={classes(styles.notice, styles.notice__warning)}>
					<InfoIcon />
					<p>
						{tokenTicker} has too little trading volume to estimate a market price. Set
						your own price with a limit order.
					</p>
				</div>
			) : (
				<div className={styles.details}>
					<div className={styles.details__row}>
						<p>Price</p>
						<p>
							{marketPriceLoading && (
								<span className={styles.details__loading}>
									<span className={styles.details__spinner} />
									Loading
								</span>
							)}
							{!marketPriceLoading && priceValid && (
								<>
									1 {tokenTicker} = {formatTokenAmount(price, 8)} ZANO
									{zanoUsd && (
										<span>
											{' '}
											≈ {formatUsd(priceDecimal.mul(zanoUsd)) ?? '$0'}
										</span>
									)}
								</>
							)}
							{!marketPriceLoading && !priceValid && '—'}
						</p>
					</div>

					{priceMode === 'market' && (
						<div className={styles.details__row}>
							<p>Source</p>
							<p>{marketPriceLoading ? '…' : (marketSource ?? '—')}</p>
						</div>
					)}

					<div className={styles.details__row}>
						<p>Available at this price</p>
						<p>
							{priceValid ? `${formatTokenAmount(liquidity, 6)} ${tokenTicker}` : '—'}
						</p>
					</div>

					<div className={styles.details__row}>
						<p>Network fee</p>
						<p>{SWAP_FEE_ZANO} ZANO</p>
					</div>
				</div>
			)}

			{liquidityNotice && !noMarketPrice && (
				<div className={styles.notice}>
					<InfoIcon />
					<p>{liquidityNotice}</p>
				</div>
			)}

			{renderAction()}
		</div>
	);
};

export default SwapForm;
