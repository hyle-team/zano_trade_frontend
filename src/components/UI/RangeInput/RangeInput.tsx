import Tooltip from '@/components/UI/Tooltip/Tooltip';
import RangeInputProps from '@/interfaces/props/components/UI/RangeInput/RangeInputProps';
import { useState } from 'react';
import styles from './RangeInput.module.scss';

function RangeInput(props: RangeInputProps) {
	const [tooltipShown, setTooltipShown] = useState(false);
	// const [inputValue, setInputValue] = useState("50");

	const inputValue = props.value;
	const { onInput } = props;

	const realValue = Math.max(Math.min(parseInt(inputValue, 10), 100), 0);

	const markersValues = [0, 25, 50, 75, 100];

	return (
		<div className={`${styles.input__range__wrapper} ${props.className || ''}`}>
			<input
				min={props.min}
				max={props.max}
				className={styles.input__range}
				type="range"
				value={realValue}
				onInput={onInput}
				disabled={props.disabled}
				list="markers"
				onMouseEnter={() => {
					setTooltipShown(true);
				}}
				onMouseLeave={() => {
					setTooltipShown(false);
				}}
			/>

			<Tooltip
				style={{ left: `calc(${(realValue * 0.95).toString()}% + 2.5%)` }}
				className={styles.input__range__tooltip}
				shown={tooltipShown}
			>
				{realValue}%
			</Tooltip>

			<div
				style={{ transition: 'none', width: `${realValue}%` }}
				className={`${styles.range__slider} ${styles.filled}`}
			></div>
			<div
				style={{ width: '100%' }}
				className={`${styles.range__slider} ${styles.unfilled}`}
			></div>
			<div className={styles.markers}>
				{markersValues.map((e) => (
					<div
						key={e}
						style={{ left: `${Math.max(Math.min(e, 100), 0)}%` }}
						className={e <= realValue ? styles.selected : ''}
					></div>
				))}
			</div>

			<datalist id="markers">
				{markersValues.map((e) => (
					<option key={e} value={e.toString()} label={`${e}%`} />
				))}
			</datalist>
		</div>
	);
}

export default RangeInput;
