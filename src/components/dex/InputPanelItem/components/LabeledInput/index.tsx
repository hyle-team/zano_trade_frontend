import LabeledInputProps from '@/interfaces/props/pages/dex/trading/InputPanelItem/LabeledInputProps';
import { classes } from '@/utils/utils';
import { useRef } from 'react';
import Input from '@/components/UI/Input/Input';
import styles from './styles.module.scss';

function LabeledInput(props: LabeledInputProps) {
	const labelRef = useRef<HTMLParagraphElement>(null);
	const { label = '', currency = '', value, readonly, setValue, invalid } = props;

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
					placeholder="0.00"
					value={value}
					readOnly={readonly}
					onInput={handleInput}
				/>

				<div className={styles.labeledInput__currency} ref={labelRef}>
					<p>{currency}</p>
				</div>
			</div>
		</div>
	);
}

export default LabeledInput;
