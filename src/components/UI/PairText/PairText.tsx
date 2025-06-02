import PairTextProps from '@/interfaces/props/components/UI/PairText/PairText';
import styles from './PairText.module.scss';

function PairText(props: PairTextProps) {
	return (
		<div className={styles.pair__text}>
			<div>
				<p style={{ width: `${props.columnWidth}px` }}>{props.first.key}:</p>
				<p>{props.first.value}</p>
			</div>
			<div>
				<p style={{ width: `${props.columnWidth}px` }}>{props.second.key}:</p>
				<p>{props.second.value}</p>
			</div>
		</div>
	);
}

export default PairText;
