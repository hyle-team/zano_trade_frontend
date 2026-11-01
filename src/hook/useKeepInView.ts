import { RefObject, useEffect } from 'react';

const INTERACTION_WINDOW_MS = 1500;
const EDGE_GAP = 16;

export function useKeepInView<T extends HTMLElement>(ref: RefObject<T>) {
	useEffect(() => {
		const element = ref.current;
		if (!element) return undefined;

		let lastInteraction = 0;
		let lastHeight = element.getBoundingClientRect().height;

		const ensureVisible = () => {
			const rect = element.getBoundingClientRect();
			const overflowBottom = rect.bottom + EDGE_GAP - window.innerHeight;
			if (overflowBottom <= 0) return;

			const maxScroll = Math.max(rect.top - EDGE_GAP, 0);
			const scrollBy = Math.min(overflowBottom, maxScroll);
			if (scrollBy > 0) window.scrollBy({ top: scrollBy, behavior: 'smooth' });
		};

		const ensureVisibleAfterLayout = () => {
			requestAnimationFrame(() => requestAnimationFrame(ensureVisible));
		};

		const markInteraction = () => {
			lastInteraction = Date.now();
		};

		const onFocusIn = (e: FocusEvent) => {
			markInteraction();
			if (e.target instanceof HTMLInputElement) ensureVisibleAfterLayout();
		};

		const onClick = (e: MouseEvent) => {
			markInteraction();
			if (e.target instanceof Element && e.target.closest('[role="tab"]')) {
				ensureVisibleAfterLayout();
			}
		};

		const observer =
			typeof ResizeObserver === 'undefined'
				? null
				: new ResizeObserver(() => {
						const { height } = element.getBoundingClientRect();
						const grew = height > lastHeight;
						lastHeight = height;

						if (grew && Date.now() - lastInteraction <= INTERACTION_WINDOW_MS) {
							ensureVisible();
						}
					});

		element.addEventListener('pointerdown', markInteraction);
		element.addEventListener('input', markInteraction);
		element.addEventListener('keydown', markInteraction);
		element.addEventListener('focusin', onFocusIn);
		element.addEventListener('click', onClick);
		observer?.observe(element);

		return () => {
			observer?.disconnect();
			element.removeEventListener('pointerdown', markInteraction);
			element.removeEventListener('input', markInteraction);
			element.removeEventListener('keydown', markInteraction);
			element.removeEventListener('focusin', onFocusIn);
			element.removeEventListener('click', onClick);
		};
	}, [ref]);
}
