import DropdownArrowIcon from '@/assets/images/UI/dropdown_arrow.svg';
import { useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { nanoid } from 'nanoid';
import { Store } from '@/store/store-reducer';
import { separateArray } from '@/utils/utils';
import useUpdateUser from '@/hook/useUpdateUser';
import CurrencyDropdownProps from '@/interfaces/props/components/UI/CurrencyDropdown/CurrencyDropdownProps';
import CurrencyRow from '@/interfaces/common/CurrencyRow';
import Dropdown from '../Dropdown/Dropdown';
import styles from './currencyDropdown.module.scss';

function CurrencyDropdown(props: CurrencyDropdownProps) {
	const [dropdownOpened, setDropdownState] = useState(false);
	const updateUser = useUpdateUser();

	const { state } = useContext(Store);
	const { value } = props;
	const { setValue } = props;

	const popupRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!dropdownOpened) {
			updateUser();
		}
	}, [dropdownOpened]);

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (
				!dropdownOpened ||
				(popupRef.current && popupRef.current.contains(e.target as Node))
			)
				return;
			setDropdownState(false);
		}
		window.addEventListener('mousedown', handleClick);
		return () => window.removeEventListener('mousedown', handleClick);
	}, [dropdownOpened]);

	return (
		<div
			ref={popupRef}
			className={`${styles.currency__dropdown__wrapper} ${props.className || ''}`}
		>
			<div
				className={`${styles.currency__dropdown__header} ${dropdownOpened ? styles.opened : ''}`}
				onClick={() => setDropdownState(!dropdownOpened)}
			>
				<div>
					{value && value.code && value.name && (
						<Image
							width={50}
							height={50}
							src={`/currencies/${value.code}.svg`}
							alt={value.name}
						></Image>
					)}
					<p>{value ? value.name : ''}</p>
				</div>
				{/* <img className={styles.dropdown__arrow} src={dropdownArrowIcon} alt="arrow"></img> */}
				<DropdownArrowIcon className={`${styles.dropdown__arrow} stroked`} />
			</div>

			{dropdownOpened && (
				<div className={styles.currency__dropdown__menu}>
					{props.withAll && (
						<div
							className={styles.currency__dropdown__all}
							onClick={() => {
								setValue({
									id: '-1',
									name: 'All',
									code: 'all',
								});
								setDropdownState(false);
							}}
						>
							<Image width={50} height={50} src={`/currencies/all.svg`} alt="all" />
							<p>All</p>
						</div>
					)}

					{props.content?.map((e, i) => (
						<Dropdown
							noStars={props.noStars}
							key={nanoid(16)}
							defaultOpen={i === 0}
							withSearch={true}
							value={{ name: e.name }}
							withImages
							setValue={(e: CurrencyRow) => {
								setValue(e);
								setDropdownState(false);
							}}
							body={
								!props.noStars
									? separateArray(e.data, (curr) =>
											(state?.user?.favourite_currencies || []).includes(
												curr.id,
											),
										)
									: e.data
							}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export default CurrencyDropdown;
