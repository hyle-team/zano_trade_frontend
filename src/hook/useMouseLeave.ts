import { ForwardedRef, useEffect } from 'react';

const useMouseLeave = (ref: ForwardedRef<HTMLElement>, callbackFn: () => void) => {
	useEffect(() => {
		const targetEl = (event: MouseEvent) => {
			if (ref && typeof ref !== 'function' && ref.current) {
				if (ref?.current && !ref?.current.contains(event.target as Node)) {
					callbackFn();
				}
			}
		};

		window.addEventListener('mousemove', targetEl);

		return () => {
			window.removeEventListener('mousemove', targetEl);
		};
	}, []);
};

export default useMouseLeave;
