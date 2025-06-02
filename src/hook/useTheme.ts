import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

function useAdvancedTheme() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (mounted) {
		return {
			setTheme,
			theme,
		};
	}

	return {
		setTheme,
		theme: 'dark',
	};
}

export default useAdvancedTheme;
