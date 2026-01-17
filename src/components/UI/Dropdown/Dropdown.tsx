import DropdownArrowIcon from '@/assets/images/UI/dropdown_arrow.svg';
import SearchIcon from '@/assets/images/UI/search_icon.svg';
import StarIcon from '@/assets/images/UI/star_icon.svg';
import Image from 'next/image';
import { useState, useEffect, useRef, useContext, MouseEvent } from 'react';
import { Store } from '@/store/store-reducer';
import { sendFavouriteCurrencies } from '@/utils/methods';
import DropdownProps from '@/interfaces/props/components/UI/Dropdown/DropdownProps';
import DropdownRow from '@/interfaces/common/DropdownRow';
import DropdownRowProps from '@/interfaces/props/components/UI/Dropdown/DropdownRowProps';
import { knownCurrencies } from '@/utils/utils';
import Input from '../Input/Input';
import styles from './Dropdown.module.scss';

function Dropdown<T extends DropdownRow>(props: DropdownProps<T>) {
	const maxItems = props.maxItems || 3;

	const { icon } = props;

	const { state } = useContext(Store);
	const { value } = props;
	const { setValue } = props;

	const [isOpen, changeOpenState] = useState(props.defaultOpen);

	const [searchState, setSearchState] = useState('');

	const popupRef = useRef<HTMLDivElement>(null);

	const [favouriteCurrencies, setFavouriteCurrencies] = useState(
		state?.user?.favourite_currencies || [],
	);

	function searchInputFunc(e: React.ChangeEvent<HTMLInputElement>) {
		if (e.target) {
			setSearchState((e.target as HTMLInputElement).value);
		}
	}

	useEffect(() => {
		function handleClick(e: globalThis.MouseEvent) {
			if (!isOpen || (popupRef.current && popupRef.current.contains(e.target as Node)))
				return;
			changeOpenState(false);
		}

		if (props.selfContained) {
			window.addEventListener('mousedown', handleClick);
			return () => window.removeEventListener('mousedown', handleClick);
		}
	}, [isOpen]);

	function getIcon(ticker: string) {
		const code = knownCurrencies.includes(ticker) ? ticker : 'ct';
		return `/currencies/${code}.svg`;
	}

	function DropdownRow(props: DropdownRowProps) {
		return (
			<div
				onClick={!props.disabled ? props.onClick : undefined}
				className={`
                    ${styles.dropdown__row}
                    ${props.header ? styles.row_header : ''} ${isOpen ? styles.opened : ''}
                    ${props.search ? styles.dropdown__search__row : ''}
                    ${props.selfContained ? styles.header__self_contained : ''}
                    ${props.className}
                    ${props.disabled ? styles.row__disabled : ''}
                `}
			>
				<div>{props.children}</div>
			</div>
		);
	}

	function CurrencyList() {
		const items = props.body?.filter((e) =>
			e.name.toLowerCase().includes(searchState.toLowerCase()),
		);

		async function starClick(event: MouseEvent, e: DropdownRow) {
			if (!e.code) return;
			if (!favouriteCurrencies.includes(e.code)) {
				setFavouriteCurrencies([...favouriteCurrencies, e.code]);
				await sendFavouriteCurrencies([...favouriteCurrencies, e.code]);
			} else {
				setFavouriteCurrencies(favouriteCurrencies.filter((fav: string) => fav !== e.code));
				await sendFavouriteCurrencies(
					favouriteCurrencies.filter((fav: string) => fav !== e.code),
				);
			}
		}

		return (
			<>
				{items?.map((e) => (
					<DropdownRow
						disabled={e.disabled}
						className={styles.dropdown__content__row}
						key={e.name}
						onClick={(event: MouseEvent<HTMLElement>) => {
							const target = event.target as HTMLElement;
							if (target && (target.tagName === 'svg' || target.tagName === 'path'))
								return;
							setValue(e);
							changeOpenState(false);
						}}
					>
						<div className={styles.dropdown__item}>
							{props.withImages && e.code && e.name && (
								<Image
									width={50}
									height={50}
									src={getIcon(e.code)}
									alt={e.name}
								></Image>
							)}
							<p>{e.name}</p>
						</div>

						{state.user?.address && !props.selfContained && !props.noStars && (
							<div
								className={styles.dropdown__star}
								onClick={(event) => starClick(event, e)}
							>
								<StarIcon
									className={
										e.code && favouriteCurrencies.includes(e.code)
											? styles.selected
											: ''
									}
								/>
							</div>
						)}
					</DropdownRow>
				))}
			</>
		);
	}

	return (
		<div ref={popupRef} className={`${styles.dropdown__wrapper} ${props.className || ''}`}>
			<DropdownRow
				onClick={() => changeOpenState(!isOpen)}
				header={true}
				selfContained={props.selfContained}
			>
				<div className={styles.dropdown__item}>
					{props.withImages && value?.code && (
						<Image
							width={50}
							height={50}
							src={getIcon(value.code)}
							alt={value.name}
						></Image>
					)}
					<p>{value?.name}</p>
				</div>
				{/* <img className={styles.dropdown__arrow} src={dropdownArrowIcon} alt="arrow"></img> */}
				{icon ?? <DropdownArrowIcon className="stroked" />}
			</DropdownRow>
			{isOpen && (
				<div
					className={
						`${styles.dropdown__menu} ${props.selfContained ? styles.self_contained : ''} ` +
						` dropdown-scroll`
					}
				>
					{props.withSearch && (
						<>
							{DropdownRow({
								search: true,
								children: (
									<div className={styles.dropdown__search}>
										<Input
											value={searchState}
											onInput={searchInputFunc}
											bordered={true}
											className={styles.dropdown__search_input}
											type="text"
											placeholder="Search"
										/>
										<SearchIcon className={styles.dropdown__search_icon} />
									</div>
								),
							})}
						</>
					)}
					<div
						style={{ maxHeight: `${maxItems * 54}px` }}
						className={`${styles.dropdown__list} ${props.selfContained ? styles.self_contained : ''} dropdown-scroll`}
					>
						<CurrencyList />
					</div>
				</div>
			)}
		</div>
	);
}

export default Dropdown;
