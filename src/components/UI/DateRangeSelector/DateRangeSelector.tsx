import CalendarIcon from '@/assets/images/UI/callendar.svg';
import CalendarArrowIcon from '@/assets/images/UI/calendar_arrow.svg';
import { useRef, useState, useEffect, ReactNode } from 'react';
import { nanoid } from 'nanoid';
import { toStandardDateString } from '@/utils/utils';
import DateRangeSelectorProps from '@/interfaces/props/components/UI/DateRangeSelector/DateRangeSelectorProps';
import Button from '../Button/Button';
import styles from './DateRangeSelector.module.scss';

function DateRangeSelector(props: DateRangeSelectorProps) {
	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];

	const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	const selectorRef = useRef<HTMLDivElement>(null);

	const [pageDate, setPageDate] = useState(new Date());

	const [selectorShown, setSelectorState] = useState(false);

	const selectedDateState = props.value;
	const setDateState = props.setValue || (() => undefined);

	const forwardButtonDisabled = !!(
		pageDate.getFullYear() === new Date().getFullYear() &&
		pageDate.getMonth() === new Date().getMonth()
	);

	function rangeSelect(date: Date) {
		if (
			(selectedDateState.first && selectedDateState.last) ||
			(!selectedDateState.first && !selectedDateState.last) ||
			(selectedDateState.first && date.getTime() < selectedDateState.first.getTime())
		) {
			// setFirstState(date);
			// setLastState(null);
			setDateState({
				first: date,
				last: null,
			});
		} else if (selectedDateState.first && date.getTime() > selectedDateState.first.getTime()) {
			setDateState({
				first: selectedDateState.first,
				last: date,
			});
		}
	}

	function getButtonClass(date: Date) {
		let className = '';

		if (
			selectedDateState.first &&
			!selectedDateState.last &&
			date.getTime() === selectedDateState.first.getTime()
		) {
			className += `${styles.selected__single} `;
		}

		if (
			selectedDateState.first &&
			selectedDateState.last &&
			date.getTime() === selectedDateState.first.getTime()
		) {
			className += `${styles.selected__starting} `;
		}

		if (
			selectedDateState.first &&
			selectedDateState.last &&
			date.getTime() === selectedDateState.last.getTime()
		) {
			className += `${styles.selected__ending} `;
		}

		if (
			selectedDateState.first &&
			selectedDateState.last &&
			date.getTime() > selectedDateState.first.getTime() &&
			date.getTime() < selectedDateState.last.getTime()
		) {
			className += `${styles.selected} `;
		}

		return className;
	}

	const dateButtons = (() => {
		const allButtons: ReactNode[] = [];
		let buttonsRow: ReactNode[] = [];
		let buttons: ReactNode[] = [];
		let workingDate = new Date(pageDate);
		workingDate.setDate(1);

		while (workingDate.getDay() !== 1) {
			workingDate.setDate(workingDate.getDate() - 1);
		}

		function pushButton(date: Date, notThisMonth: boolean) {
			buttons.push(
				<div key={nanoid(16)} className={getButtonClass(date)}>
					<Button
						onClick={() => rangeSelect(date)}
						className={notThisMonth ? styles.faded : ''}
					>
						{date.getDate()}
					</Button>
				</div>,
			);

			if (buttons.length === 1) {
				buttonsRow.push(
					<div
						key={nanoid(16)}
						className={
							selectedDateState.first &&
							selectedDateState.last &&
							date.getTime() > selectedDateState.first.getTime() &&
							date.getTime() <= selectedDateState.last.getTime()
								? styles.selected
								: ''
						}
					></div>,
				);
			}

			if (buttons.length === 7) {
				// allButtons.push(buttons);
				// buttons = [];
				buttonsRow.push(
					<div key={nanoid(16)} className={styles.row__body}>
						{buttons}
					</div>,
				);
				buttonsRow.push(
					<div
						key={nanoid(16)}
						className={
							selectedDateState.first &&
							selectedDateState.last &&
							date.getTime() >= selectedDateState.first.getTime() &&
							date.getTime() < selectedDateState.last.getTime()
								? styles.selected
								: ''
						}
					></div>,
				);
				allButtons.push(buttonsRow);
				buttons = [];
				buttonsRow = [];
			}

			const result = new Date(date);

			result.setDate(date.getDate() + 1);

			return result;
		}

		while (workingDate.getMonth() !== pageDate.getMonth()) {
			workingDate = pushButton(workingDate, true);
		}

		while (workingDate.getMonth() === pageDate.getMonth()) {
			workingDate = pushButton(workingDate, false);
		}

		while (workingDate.getDay() !== 1) {
			workingDate = pushButton(workingDate, true);
		}

		return allButtons;
	})();

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (
				!selectorShown ||
				(selectorRef.current && selectorRef.current.contains(e.target as Node))
			)
				return;
			setSelectorState(false);
			setPageDate(selectedDateState.first || new Date());
		}
		window.addEventListener('mousedown', handleClick);
		return () => window.removeEventListener('mousedown', handleClick);
	}, [selectorShown]);

	return (
		<div
			ref={selectorRef}
			className={`${styles.selector__wrapper} ${props.disabled ? styles.disabled : ''}`}
		>
			<div
				className={`${styles.selector__header} ${props.className || ''}`}
				onClick={() => {
					setSelectorState(!selectorShown);
					setPageDate(selectedDateState.first || new Date());
				}}
			>
				<p>
					{/* 2023-01-12    -    2023-04-12 */}
					{selectedDateState.first && selectedDateState.last
						? `${toStandardDateString(selectedDateState.first)}    -    ${toStandardDateString(selectedDateState.last)}`
						: 'Select date'}
				</p>
				<CalendarIcon className="dimmed" />
			</div>
			{selectorShown && (
				<div className={styles.selector__calendar}>
					<div className={styles.selector__calendar__title}>
						<h5>
							{months[pageDate.getMonth()]} {pageDate.getFullYear()}
						</h5>
						<div>
							<Button
								onClick={() => {
									const date = new Date(pageDate);
									setPageDate(new Date(date.setMonth(date.getMonth() - 1)));
								}}
							>
								{/* <img src={calendarArrowIcon} alt="back"></img> */}
								<CalendarArrowIcon className="stroked" />
							</Button>
							<Button
								onClick={() => {
									const date = new Date(pageDate);
									setPageDate(new Date(date.setMonth(date.getMonth() + 1)));
								}}
								disabled={forwardButtonDisabled}
							>
								<CalendarArrowIcon className="stroked" />
							</Button>
						</div>
					</div>
					<div className={styles.selector__calendar__body}>
						<div>
							{weekdays.map((e) => (
								<div key={nanoid(16)}>
									<p>{e}</p>
								</div>
							))}
						</div>
						<div className={styles.selector__calendar__dates}>
							{dateButtons.map((e) => (
								<div key={nanoid(16)}>{e}</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default DateRangeSelector;
