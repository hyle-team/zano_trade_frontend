import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InfoIcon } from '@/components/UI/Icons';
import { classes } from '@/utils/utils';
import styles from './styles.module.scss';
import { InfoTooltipProps } from './types';

const TOOLTIP_WIDTH = 280;
const VIEWPORT_GAP = 8;
const CLOSE_ANIMATION_MS = 150;

const InfoTooltip = ({ text, className }: InfoTooltipProps) => {
	const iconRef = useRef<HTMLSpanElement>(null);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();
	const [rect, setRect] = useState<DOMRect | null>(null);
	const [closing, setClosing] = useState(false);

	useEffect(() => () => clearTimeout(closeTimerRef.current), []);

	const open = () => {
		clearTimeout(closeTimerRef.current);
		setClosing(false);
		setRect(iconRef.current?.getBoundingClientRect() ?? null);
	};

	const close = () => {
		setClosing(true);
		closeTimerRef.current = setTimeout(() => {
			setRect(null);
			setClosing(false);
		}, CLOSE_ANIMATION_MS);
	};

	const center = rect ? rect.left + rect.width / 2 : 0;
	const left = rect
		? Math.min(
				Math.max(center - TOOLTIP_WIDTH / 2, VIEWPORT_GAP),
				window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_GAP,
			)
		: 0;

	return (
		<span
			ref={iconRef}
			className={classes(styles.infoTooltip, className)}
			onMouseEnter={open}
			onMouseLeave={close}
			onFocus={open}
			onBlur={close}
			tabIndex={0}
			aria-label={text}
		>
			<InfoIcon />

			{rect &&
				createPortal(
					<div
						role="tooltip"
						className={classes(
							styles.infoTooltip__text,
							closing && styles.infoTooltip__text_closing,
						)}
						style={{ top: rect.bottom + 10, left, width: TOOLTIP_WIDTH }}
					>
						<span
							className={styles.infoTooltip__arrow}
							style={{ left: center - left }}
						/>
						{text}
					</div>,
					document.body,
				)}
		</span>
	);
};

export default InfoTooltip;
