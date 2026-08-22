import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

type TabType = string;

type TabItem<T extends TabType> = {
	title: string;
	type: T;
	length?: number;
};

type Options<T extends TabType> = {
	tabs: TabItem<T>[];
	queryKey?: string;
	defaultType?: T;
	replace?: boolean;
};

export function useQuerySyncedTab<T extends TabType>({
	tabs,
	queryKey = 'tab',
	defaultType,
	replace = true,
}: Options<T>) {
	const router = useRouter();

	const rawValue = router.query[queryKey];
	const urlValue = (Array.isArray(rawValue) ? rawValue[0] : rawValue) as T | undefined;

	const initialTab = useMemo(() => {
		const fallback = (defaultType ?? tabs[0]?.type) as T;
		if (!urlValue) return tabs.find((t) => t.type === fallback) ?? tabs[0];
		return (
			tabs.find((t) => t.type === urlValue) ??
			tabs.find((t) => t.type === fallback) ??
			tabs[0]
		);
	}, [tabs, urlValue, defaultType]);

	const [active, setActive] = useState<TabItem<T>>(initialTab);

	useEffect(() => {
		setActive(initialTab);
	}, [initialTab]);

	const setActiveTab = (next: TabItem<T> | T) => {
		const nextType = (typeof next === 'string' ? next : next.type) as T;

		const found = tabs.find((t) => t.type === nextType);
		if (found) setActive(found);

		const def = (defaultType ?? tabs[0]?.type) as T;
		const query = { ...router.query };

		if (nextType === def) {
			delete query[queryKey];
		} else {
			query[queryKey] = nextType;
		}

		const url = { pathname: router.pathname, query };
		const options = { shallow: true, scroll: false };

		if (replace) {
			router.replace(url, undefined, options);
		} else {
			router.push(url, undefined, options);
		}
	};

	return { active, setActiveTab };
}
