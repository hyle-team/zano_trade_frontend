import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const urlValue = searchParams.get(queryKey) as T | null;

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

		const params = new URLSearchParams(searchParams.toString());
		const def = (defaultType ?? tabs[0]?.type) as T;
		if (nextType === def) {
			params.delete(queryKey);
		} else {
			params.set(queryKey, nextType);
		}

		const url = params.toString() ? `${pathname}?${params}` : pathname;

		if (replace) {
			router.replace(url, { scroll: false });
		} else {
			router.push(url, { scroll: false });
		}
	};

	return { active, setActiveTab };
}
