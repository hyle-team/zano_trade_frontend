import React from 'react';
import { classes, formatTime } from '@/utils/utils';
import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import EmptyMessage from '@/components/UI/EmptyMessage';
import styles from './styles.module.scss';
import { AllTradesProps } from './types';

const AllTrades = ({
	setTradesType,
	tradesType,
	filteredTrades,
	tradesLoading,
	currencyNames,
}: AllTradesProps) => {
	return (
		<div className={styles.allTrades}>
			<div className={styles.allTrades__header}>
				<button
					onClick={() => setTradesType('all')}
					className={classes(
						styles.allTrades__header_btn,
						tradesType === 'all' && styles.active,
					)}
				>
					All Trades
				</button>

				<button
					onClick={() => setTradesType('my')}
					className={classes(
						styles.allTrades__header_btn,
						tradesType === 'my' && styles.active,
					)}
				>
					My Trades
				</button>
			</div>

			<div className={styles.allTrades__content}>
				<table>
					<thead>
						<tr>
							<th>Price ({currencyNames.secondCurrencyName})</th>
							<th>Amount ({currencyNames.firstCurrencyName})</th>
							<th>Time</th>
						</tr>
					</thead>

					{!tradesLoading && !!filteredTrades.length && (
						<tbody className="orders-scroll">
							{filteredTrades.map((trade) => (
								<tr key={trade.id}>
									<td>
										<p
											style={{
												color: trade.id % 2 === 0 ? '#16D1D6' : '#FF6767',
											}}
										>
											{trade.price}
										</p>
									</td>
									<td>
										<p>{trade.amount}</p>
									</td>
									<td>
										<p>{formatTime(trade.timestamp)}</p>
									</td>
								</tr>
							))}
						</tbody>
					)}
				</table>

				{!filteredTrades.length && !tradesLoading && <EmptyMessage text="No trades" />}

				{tradesLoading && <ContentPreloader style={{ marginTop: 40 }} />}
			</div>
		</div>
	);
};

export default AllTrades;
