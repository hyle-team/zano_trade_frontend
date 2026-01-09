import React from 'react';
import type { TooltipRenderProps } from 'react-joyride';
import styles from './styles.module.scss';
import Button from '../Button/Button';

export default function GuideTooltip({
	index,
	size,
	step,
	primaryProps,
	skipProps,
	tooltipProps,
	isLastStep,
}: TooltipRenderProps) {
	return (
		<div {...tooltipProps} className={styles.tooltip}>
			<div className={styles.tooltip__body}>
				<div className={styles.tooltip__index}>
					{index + 1}/{size}
				</div>
				<div className={styles.tooltip__content}>
					{typeof step.content === 'string' ? <p>{step.content}</p> : step.content}
				</div>

				<Button {...(primaryProps as object)} className={styles.tooltip__btn}>
					{isLastStep ? 'Close' : 'Continue'}
				</Button>
			</div>

			{!isLastStep && (
				<button {...skipProps} className={styles.tooltip__skip}>
					Skip guide
				</button>
			)}
		</div>
	);
}
