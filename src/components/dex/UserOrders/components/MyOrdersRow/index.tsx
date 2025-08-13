import Decimal from 'decimal.js';
import { nanoid } from 'nanoid';
import { useContext, useState } from 'react';
import { cutAddress, formatDollarValue, notationToString } from '@/utils/utils';
import Tooltip from '@/components/UI/Tooltip/Tooltip';
import Link from 'next/link';
import { cancelOrder } from '@/utils/methods';
import { Store } from '@/store/store-reducer';
import { useAlert } from '@/hook/useAlert';
import BadgeStatus from '../../../BadgeStatus';
import styles from '../../styles.module.scss';
import MatrixConnectionBadge from '../../../MatrixConnectionBadge';
import OrderRowTooltipCell from '../../../OrderRowTooltipCell';
import { MyOrdersRowProps } from './types';

function MyOrdersRow(props: MyOrdersRowProps) {
	const {
		orderData,
		secondAssetUsdPrice,
		fetchUser,
		updateOrders,
		updateUserOrders,
		matrixAddresses,
		applyTips,
	} = props;

	const e = orderData || {};
	const { state } = useContext(Store);
	const { setAlertState, setAlertSubtitle } = useAlert();
	const [cancellingState, setCancellingState] = useState(false);

	const totalDecimal = new Decimal(e.left).mul(new Decimal(e.price));
	const totalValue = secondAssetUsdPrice
		? totalDecimal.mul(secondAssetUsdPrice).toFixed(2)
		: undefined;

	const [showTooltip, setShowTooltip] = useState(false);

	async function cancelClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
		event.preventDefault();

		if (cancellingState) return;

		try {
			setCancellingState(true);
			const result = await cancelOrder(e.id);

			if (!result.success) {
				setAlertState('error');
				setAlertSubtitle('Error while cancelling order');
				setTimeout(() => {
					setAlertState(null);
					setAlertSubtitle('');
				}, 3000);
				return;
			}

			await updateOrders();
			await updateUserOrders();
			await fetchUser();
		} catch (error) {
			console.log(error);
		} finally {
			setCancellingState(false);
		}
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
						@
						{cutAddress(
							state.wallet?.connected && state.wallet?.alias
								? state.wallet.alias
								: 'no alias',
							12,
						)}
					</span>

					<MatrixConnectionBadge
						userAdress={state?.wallet?.address}
						userAlias={state.wallet?.alias}
						matrixAddresses={matrixAddresses}
					/>
					{e.isInstant && (
						<div style={{ marginLeft: 2 }}>
							<BadgeStatus type="instant" icon />
						</div>
					)}
				</p>

				{(state.wallet?.connected && state.wallet?.alias ? state.wallet?.alias : '')
					?.length > 12 && (
					<Tooltip
						className={styles.tooltip}
						arrowClass={styles.tooltip__arrow}
						shown={showTooltip}
					>
						<p className={styles.tooltip__text}>
							{state.wallet?.connected && state.wallet?.alias}
						</p>
					</Tooltip>
				)}
			</td>

			<OrderRowTooltipCell style={{ color: e.type === 'buy' ? '#16D1D6' : '#FF6767' }}>
				{notationToString(e.price)}
			</OrderRowTooltipCell>

			<OrderRowTooltipCell>{notationToString(e.amount)}</OrderRowTooltipCell>

			<OrderRowTooltipCell
				noTooltip
				style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
			>
				{notationToString(totalDecimal.toString())}{' '}
				<span>~ ${totalValue && formatDollarValue(totalValue)}</span>
			</OrderRowTooltipCell>

			<td>
				<p style={{ fontWeight: 700, color: '#1F8FEB' }}>
					{applyTips?.filter((tip) => tip.connected_order_id === e.id)?.length || 0}
				</p>
			</td>
			<td>
				<Link href="/" onClick={cancelClick}>
					{cancellingState ? 'Process' : 'Cancel'}
				</Link>
			</td>
		</tr>
	);
}

export default MyOrdersRow;
