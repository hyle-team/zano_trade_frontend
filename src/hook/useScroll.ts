import { useCallback, useRef } from 'react';

function useScroll<T extends HTMLElement>() {
	const elementRef = useRef<T | null>(null);

	const scrollToElement = useCallback((options?: ScrollIntoViewOptions) => {
		if (elementRef.current) {
			elementRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'nearest',
				...options,
			});
		}
	}, []);

	return { elementRef, scrollToElement };
}

export default useScroll;
