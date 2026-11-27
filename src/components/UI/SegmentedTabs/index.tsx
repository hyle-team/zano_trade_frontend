import { ReactNode, useEffect, useRef, useState } from 'react';
import { classes } from '@/utils/utils';
import styles from './styles.module.scss';

export interface SegmentedTab<T extends string> {
	value: T;
	label: ReactNode;
}

interface SegmentedTabsProps<T extends string> {
	tabs: SegmentedTab<T>[];
	value: T;
	onChange: (_value: T) => void;
	size?: 'md' | 'sm';
	className?: string;
}

function SegmentedTabs<T extends string>({
	tabs,
	value,
	onChange,
	size = 'md',
	className,
}: SegmentedTabsProps<T>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
	const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
	const [animated, setAnimated] = useState(false);

	useEffect(() => {
		if (!indicator || animated) return;
		const frame = requestAnimationFrame(() => setAnimated(true));
		return () => cancelAnimationFrame(frame);
	}, [indicator, animated]);

	useEffect(() => {
		const update = () => {
			const activeTab = tabRefs.current[value];
			if (!activeTab) return;
			setIndicator({ left: activeTab.offsetLeft, width: activeTab.offsetWidth });
		};

		update();

		const observer = new ResizeObserver(update);
		if (containerRef.current) observer.observe(containerRef.current);

		return () => observer.disconnect();
	}, [value, tabs]);

	return (
		<div
			ref={containerRef}
			className={classes(styles.tabs, styles[size], className)}
			role="tablist"
		>
			<span
				className={classes(
					styles.indicator,
					!indicator && styles.indicator__hidden,
					!animated && styles.indicator__static,
				)}
				style={
					indicator
						? { transform: `translateX(${indicator.left}px)`, width: indicator.width }
						: undefined
				}
			/>

			{tabs.map((tab) => (
				<button
					key={tab.value}
					ref={(el) => {
						tabRefs.current[tab.value] = el;
					}}
					type="button"
					role="tab"
					aria-selected={tab.value === value}
					className={classes(
						styles.tab,
						tab.value === value && styles.active,
						tab.value === value && !indicator && styles.active__fallback,
					)}
					onClick={() => onChange(tab.value)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}

export default SegmentedTabs;
