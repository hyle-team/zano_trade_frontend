import Tooltip from '@/components/UI/Tooltip/Tooltip';
import { useState } from 'react';
import styles from './styles.module.scss';
import { OrderRowTooltipCellProps } from './types';

function OrderRowTooltipCell({
	style,
	children,
	sideText,
	sideTextColor,
	noTooltip,
}: OrderRowTooltipCellProps) {
	const [showTooltip, setShowTooltip] = useState(false);

	const tooltipText = `${children}${sideText ? ` ~${sideText}` : ''}`;

	const isLongContent = tooltipText.length > 14;

	return (
		<td className={styles.row}>
			<p
				style={style}
				onMouseEnter={() => setShowTooltip(true)}
				onMouseLeave={() => setShowTooltip(false)}
			>
				{children}
				{sideText && (
					<span
						style={{
							fontSize: '15px',
							margin: 0,
							color: sideTextColor || 'var(--font-dimmed-color)',
						}}
					>
						{sideText}
					</span>
				)}
			</p>
			{isLongContent && !noTooltip && (
				<Tooltip
					className={styles.tooltip}
					arrowClass={styles.tooltip__arrow}
					shown={showTooltip}
				>
					{tooltipText}
				</Tooltip>
			)}
		</td>
	);
}

export default OrderRowTooltipCell;
