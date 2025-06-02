import TooltipProps from '@/interfaces/props/components/UI/Tooltip/TooltipProps';
import styles from './Tooltip.module.scss';

function Tooltip(props: TooltipProps) {
	return props.shown ? (
		<div style={props.style} className={`${props.className || ''} ${styles.tooltip}`}>
			<div className={`${props.arrowClass || ''} ${styles.tooltip__arrow}`}></div>
			<p>{props.children}</p>
		</div>
	) : (
		<></>
	);
}

export default Tooltip;
