import LabeledInputProps from '@/interfaces/props/pages/dex/trading/InputPanelItem/LabeledInputProps';
import { classes, formatDollarValue } from '@/utils/utils';
import { useRef } from 'react';
import Input from '@/components/UI/Input/Input';
import styles from './styles.module.scss';

function LabeledInput(props: LabeledInputProps) {
	const labelRef = useRef<HTMLParagraphElement>(null);
	const {
		label = '',
		placeholder = '',
		currency = '',
		value,
		readonly,
		usd,
		setValue,
		invalid,
	} = props;

	const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
		if (!readonly && setValue) {
			setValue(e.currentTarget.value);
		}
	};

	return (
		<div className={styles.labeledInput}>
			<h6 className={styles.labeledInput__label}>{label}</h6>
			<div className={classes(styles.labeledInput__wrapper, invalid && styles.invalid)}>
				<Input
					bordered
					placeholder={placeholder}
					value={value}
					readOnly={readonly}
					onInput={handleInput}
				/>

				{usd && (
					<div className={styles.labeledInput__value}>
						<p>~${formatDollarValue(usd)}</p>
					</div>
				)}

				<div className={styles.labeledInput__currency} ref={labelRef}>
					<p>{currency}</p>
				</div>
			</div>
		</div>
	);
}

export default LabeledInput;
