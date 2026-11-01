import { KeyboardEvent, PointerEvent, RefObject, useRef, useState } from 'react';
import { classes } from '@/utils/utils';
import styles from './styles.module.scss';

interface PanelResizerProps {
	targetRef: RefObject<HTMLElement>;
	neighborRef: RefObject<HTMLElement>;
	minWidth: number;
	minNeighborWidth: number;
	maxRatio?: number;
	onResize: (_width: number) => void;
	onResizeEnd: (_width: number) => void;
	onReset: () => void;
	className?: string;
}

const KEYBOARD_STEP = 20;

function PanelResizer({
	targetRef,
	neighborRef,
	minWidth,
	minNeighborWidth,
	maxRatio = 1,
	onResize,
	onResizeEnd,
	onReset,
	className,
}: PanelResizerProps) {
	const [dragging, setDragging] = useState(false);
	const dragRef = useRef<{ startX: number; startWidth: number; maxWidth: number } | null>(null);
	const widthRef = useRef(0);

	const getBounds = () => {
		const width = targetRef.current?.getBoundingClientRect().width ?? 0;
		const neighborWidth = neighborRef.current?.getBoundingClientRect().width ?? 0;
		const containerWidth =
			targetRef.current?.parentElement?.getBoundingClientRect().width ?? Infinity;
		const maxWidth = Math.max(
			minWidth,
			Math.min(width + neighborWidth - minNeighborWidth, containerWidth * maxRatio),
		);
		return { width, maxWidth };
	};

	const clamp = (value: number, max: number) =>
		Math.round(Math.min(Math.max(value, minWidth), max));

	const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
		if (e.button !== 0) return;
		e.preventDefault();

		const { width, maxWidth } = getBounds();
		dragRef.current = { startX: e.clientX, startWidth: width, maxWidth };
		widthRef.current = Math.round(width);

		e.currentTarget.setPointerCapture(e.pointerId);
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
		setDragging(true);
	};

	const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag) return;

		const next = clamp(drag.startWidth - (e.clientX - drag.startX), drag.maxWidth);
		if (next === widthRef.current) return;

		widthRef.current = next;
		onResize(next);
	};

	const finish = (e: PointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag) return;

		dragRef.current = null;
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
		setDragging(false);
		if (widthRef.current !== Math.round(drag.startWidth)) onResizeEnd(widthRef.current);
	};

	const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();

		const { width, maxWidth } = getBounds();
		const delta = e.key === 'ArrowLeft' ? KEYBOARD_STEP : -KEYBOARD_STEP;
		const next = clamp(width + delta, maxWidth);

		onResize(next);
		onResizeEnd(next);
	};

	return (
		<div
			className={classes(styles.resizer, dragging && styles.resizer__active, className)}
			role="separator"
			aria-orientation="vertical"
			aria-label="Resize panels"
			tabIndex={0}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={finish}
			onPointerCancel={finish}
			onDoubleClick={onReset}
			onKeyDown={onKeyDown}
		>
			<span className={styles.resizer__grip} />
		</div>
	);
}

export default PanelResizer;
