import React, { useContext, useState } from 'react';
import { cutAddress, formatDollarValue, notationToString } from '@/utils/utils';
import { nanoid } from 'nanoid';
import Tooltip from '@/components/UI/Tooltip/Tooltip';
import Decimal from 'decimal.js';
import { confirmIonicSwap, ionicSwap } from '@/utils/wallet';
import { applyOrder, confirmTransaction } from '@/utils/methods';
import { updateAutoClosedNotification } from '@/store/actions';
import Link from 'next/link';
import { Store } from '@/store/store-reducer';
import { useAlert } from '@/hook/useAlert';
import OrderRowTooltipCell from '../../../OrderRowTooltipCell';
import MatrixConnectionBadge from '../../../MatrixConnectionBadge';
import styles from '../../styles.module.scss';
import { MyOrdersApplyRowProps } from './types';
import BadgeStatus from '../../../BadgeStatus';

function MyOrdersApplyRow(props: MyOrdersApplyRowProps) {
	const {
		orderData,
		fetchUser,
		matrixAddresses,
		secondAssetUsdPrice,
		updateOrders,
		updateUserOrders,
		fetchTrades,
		pairData,
		userOrders,
	} = props;
	const e = orderData || {};

	const { state, dispatch } = useContext(Store);
	const { setAlertState, setAlertSubtitle } = useAlert();
	const [applyingState, setApplyingState] = useState(false);

	const connectedOrder = userOrders.find((order) => order.id === e.connected_order_id);

	const totalDecimal = new Decimal(e.left).mul(new Decimal(e.price));
	const totalValue = secondAssetUsdPrice
		? totalDecimal.mul(secondAssetUsdPrice).toFixed(2)
		: undefined;

	const [showTooltip, setShowTooltip] = useState(false);

	async function applyClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
		event.preventDefault();

		if (e.id) {
			updateAutoClosedNotification(dispatch, [
				...state.closed_notifications,
				parseInt(e.id, 10),
			]);
		}

		function alertErr(subtitle: string) {
			setAlertState('error');
			setAlertSubtitle(subtitle);
			setTimeout(() => {
				setAlertState(null);
				setAlertSubtitle('');
			}, 3000);
		}

		setApplyingState(true);
		interface SwapOperationResult {
			success: boolean;
			message?: string;
			errorCode?: number;
			data?: unknown;
		}

		let result: SwapOperationResult | null = null;

		await (async () => {
			if (e.transaction) {
				if (!e.hex_raw_proposal) {
					alertErr('Invalid transaction data received');
					return;
				}

				console.log(e.hex_raw_proposal);

				const confirmSwapResult = await confirmIonicSwap(e.hex_raw_proposal);

				console.log(confirmSwapResult);

				if (confirmSwapResult.data?.error?.code === -7) {
					alertErr('Insufficient funds');
					return;
				}
				if (!confirmSwapResult.data?.result) {
					alertErr('Companion responded with an error');
					return;
				}

				result = await confirmTransaction(e.id);
			} else {
				const firstCurrencyId = pairData?.first_currency.asset_id;
				const secondCurrencyId = pairData?.second_currency.asset_id;

				console.log(firstCurrencyId, secondCurrencyId);

				if (!(firstCurrencyId && secondCurrencyId)) {
					alertErr('Invalid transaction data received');
					return;
				}

				if (!connectedOrder) return;

				const leftDecimal = new Decimal(e.left);
				const priceDecimal = new Decimal(e.price);

				const params = {
					destinationAssetID: e.type === 'buy' ? secondCurrencyId : firstCurrencyId,
					destinationAssetAmount: notationToString(
						e.type === 'buy'
							? leftDecimal.mul(priceDecimal).toString()
							: leftDecimal.toString(),
					),
					currentAssetID: e.type === 'buy' ? firstCurrencyId : secondCurrencyId,
					currentAssetAmount: notationToString(
						e.type === 'buy'
							? leftDecimal.toString()
							: leftDecimal.mul(priceDecimal).toString(),
					),

					destinationAddress: e.user.address,
				};

				console.log(params);

				const createSwapResult = await ionicSwap(params);

				console.log(createSwapResult);

				const hex = createSwapResult?.data?.result?.hex_raw_proposal;

				if (createSwapResult?.data?.error?.code === -7) {
					alertErr('Insufficient funds');
					return;
				}
				if (!hex) {
					alertErr('Companion responded with an error');
					return;
				}

				result = await applyOrder({
					...e,
					hex_raw_proposal: hex,
				});
			}
		})();

		setApplyingState(false);

		if (!result) {
			return;
		}

		if (!(result as { success: boolean }).success) {
			alertErr('Server responded with an error');
			return;
		}

		await updateOrders();
		await updateUserOrders();
		await fetchUser();
		await fetchTrades();
	}

	return (
		<tr key={nanoid(16)}>
			<td>
				<p className={styles.alias}>
					<span
						onMouseEnter={() => setShowTooltip(true)}
						onMouseLeave={() => setShowTooltip(false)}
						className={styles.alias__text}
					>
						@{cutAddress(e.user.alias, 12) || 'no alias'}
					</span>

					<MatrixConnectionBadge
						userAdress={e.user.address}
						userAlias={e.user.alias}
						matrixAddresses={matrixAddresses}
					/>
					{e.isInstant && (
						<div style={{ marginLeft: 2 }}>
							<BadgeStatus type="instant" icon />
						</div>
					)}
				</p>

				{(e.isInstant || e.transaction) && <BadgeStatus type="instant" />}

				{e.user?.alias.length > 12 && (
					<Tooltip
						className={styles.tooltip}
						arrowClass={styles.tooltip__arrow}
						shown={showTooltip}
					>
						<p className={styles.tooltip__text}>{e.user?.alias}</p>
					</Tooltip>
				)}
			</td>

			<OrderRowTooltipCell style={{ color: e.type === 'buy' ? '#16D1D6' : '#FF6767' }}>
				{notationToString(e.price)}
			</OrderRowTooltipCell>
			<OrderRowTooltipCell>{notationToString(e.left)}</OrderRowTooltipCell>

			<OrderRowTooltipCell
				noTooltip
				style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
			>
				{notationToString(totalDecimal.toString())}{' '}
				<span>~ ${totalValue && formatDollarValue(totalValue)}</span>
			</OrderRowTooltipCell>

			<td></td>
			<td>
				<Link href="/" onClick={applyClick}>
					{applyingState ? 'Process' : 'Apply'}
				</Link>
			</td>
		</tr>
	);
}

export default MyOrdersApplyRow;
