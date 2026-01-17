import EmptyLink from '@/components/UI/EmptyLink/EmptyLink';
import ArrowIcon from '@/assets/images/UI/arrow.svg';
import NoOffersIcon from '@/assets/images/UI/no_offers.svg';
import ProfileWidget from '@/components/UI/ProfileWidget/ProfileWidget';
import PairText from '@/components/UI/PairText/PairText';
import Button from '@/components/UI/Button/Button';
import Popup from '@/components/UI/Popup/Popup';
import { useState } from 'react';
import DetailedOfferPopup from '@/components/default/DetailedOfferPopup/DetailedOfferPopup';
import DepositTitle from '@/components/UI/DepositTitle/DepositTitle';
import ContentPreloader from '@/components/UI/ContentPreloader/ContentPreloader';
import { nanoid } from 'nanoid';
import HomeTableProps from '@/interfaces/props/pages/p2p/components/HomeTable/HomeTableProps';
import OfferData from '@/interfaces/responses/offers/OfferData';
import styles from './HomeTable.module.scss';

function HomeTable(props: HomeTableProps) {
	const { priceDescending } = props;
	const setPriceState = props.setPriceState || (() => undefined);

	const offers = props.offers || [];

	function Row(props: { offerData: OfferData }) {
		const { offerData } = props;

		const [popupShown, setPopupState] = useState(false);

		return (
			<tr>
				<td>
					<ProfileWidget offerData={offerData}></ProfileWidget>
				</td>
				<td>
					<EmptyLink className={styles.home__header__mobile}>Price</EmptyLink>
					<p className={styles.home__row__price}>
						<span>{props.offerData.price}</span> {props.offerData.target_currency?.name}
					</p>
				</td>
				<td>
					<EmptyLink className={styles.home__header__mobile}>Limits</EmptyLink>
					<PairText
						columnWidth={65}
						first={{
							key: 'Min',
							value: `${offerData.min} ${offerData.input_currency?.name}`,
						}}
						second={{
							key: 'Max',
							value: `${offerData.max} ${offerData.input_currency?.name}`,
						}}
					/>
				</td>
				<td>
					<DepositTitle className={styles.home__header__mobile} />
					<PairText
						columnWidth={80}
						first={{
							key: 'Seller',
							value: `${offerData.deposit_seller} ${offerData.deposit_currency?.name}`,
						}}
						second={{
							key: 'Buyer',
							value: `${offerData.deposit_buyer} ${offerData.deposit_currency?.name}`,
						}}
					/>
				</td>
				<td>
					<Button
						onClick={() => setPopupState(true)}
						className={offerData.type === 'buy' ? styles.btn_buy : styles.btn_sell}
					>
						View details
					</Button>

					{popupShown && (
						<Popup
							settings={{ offerData, setPopupState }}
							Content={DetailedOfferPopup}
							blur={true}
							close={() => setPopupState(false)}
							scroll={true}
						/>
					)}
				</td>
			</tr>
		);
	}

	return (
		<div className={styles.home_table__wrapper}>
			<table>
				<thead>
					<tr>
						<th>
							<EmptyLink>Makers</EmptyLink>
						</th>
						<th>
							<div
								className={styles.home_table__title__price}
								onClick={() => setPriceState(!priceDescending)}
							>
								<EmptyLink>
									Price ({priceDescending ? 'Descending' : 'Ascending'})
								</EmptyLink>
								<ArrowIcon
									style={priceDescending ? { transform: 'rotateX(180deg)' } : {}}
								/>
							</div>
						</th>
						<th>
							<EmptyLink>Limits</EmptyLink>
						</th>
						<th>
							<DepositTitle />
						</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{offers.map((e) => (
						<Row key={nanoid(16)} offerData={e} />
					))}
				</tbody>
			</table>

			{!offers.length && !props.preloaderState && (
				<div className={styles.home__table__message}>
					<div>
						<NoOffersIcon />
						<p>No offers</p>
					</div>
				</div>
			)}

			{props.preloaderState && <ContentPreloader className={styles.home__table__message} />}
		</div>
	);
}

export default HomeTable;
