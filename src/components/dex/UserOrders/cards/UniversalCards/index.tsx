import React from 'react';
import { classes, formatTimestamp, notationToString } from '@/utils/utils';
import OrderRow from '@/interfaces/common/OrderRow';
import TotalUsdCell from '@/components/dex/TotalUsdCell';
import EmptyMessage from '@/components/UI/EmptyMessage';
import AliasCell from '@/components/dex/AliasCell';
import { UniversalCardsProps } from './types';
import styles from '../styles.module.scss';
import RequestActionCell from '../../components/RequestActionCell';
import CancelActionCell from '../../components/CancelActionCell';
import ItemsCountCell from '../../components/ItemsCountCell';
import { OrderItemsKind } from '../../components/OrderItemsModal/types';

const OffersRow = ({
	order,
	onOpenItems,
	mobile,
}: {
	order: OrderRow;
	onOpenItems: (_kind: OrderItemsKind, _order: OrderRow) => void;
	mobile?: boolean;
}) => (
	<div
		className={classes(
			styles.card__row,
			styles.sm,
			styles.card__offers,
			mobile && styles.mobile,
		)}
	>
		<div className={styles.card__col}>
			<p className={styles.card__label}>Matches</p>
			<ItemsCountCell
				className={styles.card__value}
				count={order.matches_count ?? 0}
				onClick={() => onOpenItems('matches', order)}
			/>
		</div>
		<div className={styles.card__col}>
			<p className={styles.card__label}>Requests</p>
			<ItemsCountCell
				className={styles.card__value}
				count={order.incoming_proposals_count ?? 0}
				onClick={() => onOpenItems('requests', order)}
			/>
		</div>
		<div className={styles.card__col}>
			<p className={styles.card__label}>Offers</p>
			<ItemsCountCell
				className={styles.card__value}
				count={order.outgoing_proposals_count ?? 0}
				onClick={() => onOpenItems('offers', order)}
			/>
		</div>
	</div>
);

const AliasRow = ({ label = 'Alias', children }: { label?: string; children: React.ReactNode }) => (
	<div className={styles.card__col}>
		<p className={styles.card__label}>{label}</p>
		<div className={styles.card__value}>{children}</div>
	</div>
);

const EMPTY_MESSAGES: Record<UniversalCardsProps['type'], string> = {
	orders: 'No orders',
	matches: 'No suitables',
	requests: 'No requests',
	offers: 'No offers',
	history: 'No data',
};

export default function UniversalCards(props: UniversalCardsProps) {
	const { firstCurrencyName, secondCurrencyName, secondAssetUsdPrice, data, onAfter, type } =
		props;

	if (!data?.length)
		return (
			<div className={styles.cards}>
				<EmptyMessage text={EMPTY_MESSAGES[type]} />
			</div>
		);

	return (
		<div className={styles.cards}>
			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
			{data.map((row: any) => {
				const side: 'buy' | 'sell' = row.type ?? row.creator;

				const Header = (
					<div className={styles.card__row}>
						<div className={classes(styles.card__col, styles.card__pair)}>
							<p className={styles.card__label}>Pair</p>
							<p className={styles.card__value}>
								{firstCurrencyName}/{secondCurrencyName}
								<span className={styles.card__type}>{side}</span>
							</p>
						</div>
						<div className={classes(styles.card__col, styles.card__col_direction)}>
							<p className={styles.card__label}>Direction</p>
							<p className={classes(styles.card__value, styles.card__type)}>{side}</p>
						</div>
						<div className={classes(styles.card__col, styles.card__col_timestamp)}>
							<p className={styles.card__label}>Time</p>
							<p className={styles.card__value}>
								{formatTimestamp(Number(row.timestamp))}
							</p>
						</div>
						<div
							className={classes(
								styles.card__col,
								type !== 'history' ? styles.card__price : undefined,
							)}
						>
							<p className={styles.card__label}>Price ({secondCurrencyName})</p>
							<p className={styles.card__value}>{notationToString(row.price)}</p>
						</div>
						{type === 'orders' && (
							<div className={styles.card__col}>
								<p className={styles.card__label}>Quantity ({firstCurrencyName})</p>
								<p className={styles.card__value}>
									{notationToString(row.amount ?? row.left)}
								</p>
							</div>
						)}
					</div>
				);

				const Metrics = (
					<>
						{type !== 'orders' && (
							<div className={styles.card__col}>
								<p className={styles.card__label}>Quantity ({firstCurrencyName})</p>
								<p className={styles.card__value}>
									{notationToString(row.amount ?? row.left)}
								</p>
							</div>
						)}
						{(type === 'orders' || type === 'history') && (
							<div className={styles.card__col}>
								<p className={styles.card__label}>Min ({firstCurrencyName})</p>
								<p className={styles.card__value}>
									{row.min_per_apply_amount !== null
										? notationToString(row.min_per_apply_amount)
										: 'No'}
								</p>
							</div>
						)}
						<div className={styles.card__col}>
							<p className={styles.card__label}>Total ({secondCurrencyName})</p>
							<TotalUsdCell
								className={styles.card__value}
								amount={row.amount ?? row.left}
								price={row.price}
								secondAssetUsdPrice={secondAssetUsdPrice}
							/>
						</div>
						{type !== 'history' && (
							<div
								className={classes(
									styles.card__col,
									styles.card__price,
									styles.mobile,
								)}
							>
								<p className={styles.card__label}>Price ({secondCurrencyName})</p>
								<p className={styles.card__value}>{notationToString(row.price)}</p>
							</div>
						)}
					</>
				);

				let MiddleBlock: React.ReactNode = null;
				let BottomRowLeft: React.ReactNode = null;
				let Actions: React.ReactNode = null;

				if (props.type === 'orders') {
					MiddleBlock = <OffersRow order={row} onOpenItems={props.onOpenItems} />;
					BottomRowLeft = (
						<OffersRow order={row} onOpenItems={props.onOpenItems} mobile />
					);
					Actions = (
						<div className={styles.card__actions}>
							<CancelActionCell id={row.id} onAfter={onAfter} />
						</div>
					);
				}

				if (props.type === 'matches' || props.type === 'offers') {
					MiddleBlock = null;
					BottomRowLeft = (
						<AliasRow>
							<AliasCell
								alias={row.user?.alias}
								address={row.user?.address}
								matrixAddresses={props.matrixAddresses}
								isInstant={row.isInstant}
							/>
						</AliasRow>
					);

					const connectedOrder = props.userOrders?.find(
						(o) => String(o.id) === String(row.connected_order_id),
					);

					Actions = (
						<div className={styles.card__actions}>
							<RequestActionCell
								type={props.type === 'matches' ? 'request' : 'accept'}
								row={row}
								pairData={props.pairData}
								connectedOrder={connectedOrder}
								onAfter={onAfter}
							/>
							{props.type === 'offers' && (
								<CancelActionCell type="reject" id={row.id} onAfter={onAfter} />
							)}
						</div>
					);
				}

				if (props.type === 'requests') {
					MiddleBlock = null;
					BottomRowLeft = (
						<AliasRow>
							<AliasCell
								alias={row.finalizer?.alias}
								address={row.finalizer?.address}
								matrixAddresses={props.matrixAddresses}
							/>
						</AliasRow>
					);

					Actions = (
						<div className={styles.card__actions}>
							<CancelActionCell
								type="cancel_tx"
								id={String(row.id)}
								onAfter={onAfter}
							/>
						</div>
					);
				}

				if (props.type === 'history') {
					MiddleBlock = null;
					BottomRowLeft = null;
					Actions = null;
				}

				return (
					<div key={row.id} className={classes(styles.card, styles[side])}>
						{Header}

						<div className={styles.card__flex}>
							<div className={styles.card__row}>
								{Metrics}
								{MiddleBlock}
							</div>

							<div className={styles.card__row}>
								{BottomRowLeft}
								{Actions}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
