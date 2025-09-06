import GuideTooltip from '@/components/UI/GuideTooltip';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CallBackProps, EVENTS, STATUS, Step } from 'react-joyride';
import dynamic from 'next/dynamic';

const JoyrideNoSSR = dynamic(() => import('react-joyride'), { ssr: false });

type TourName = string;
type Registry = Record<TourName, Step[]>;

type Ctx = {
	register: (_name: TourName, _steps: Step[]) => void;
	start: (_name: TourName) => void;
	startOnce: (_name: TourName, _version?: string) => void;
	stop: () => void;
	isRunning: boolean;
	active?: TourName;
};

const TourCtx = createContext<Ctx | null>(null);
const STORAGE_PREFIX = 'tour.seen:';

export function GuideProvider({ children }: { children: React.ReactNode }) {
	const registryRef = useRef<Registry>({});
	const [run, setRun] = useState(false);
	const [active, setActive] = useState<TourName | undefined>(undefined);
	const [stepIndex, setStepIndex] = useState(0);

	const register = useCallback<Ctx['register']>((name, steps) => {
		registryRef.current[name] = steps;
	}, []);

	const start = useCallback((name: TourName) => {
		if (!registryRef.current[name]?.length) return;
		setActive(name);
		setStepIndex(0);
		setRun(true);
	}, []);

	const startOnce = useCallback(
		(name: TourName, version = 'v1') => {
			const key = `${STORAGE_PREFIX}${name}:${version}`;
			if (!localStorage.getItem(key)) {
				localStorage.setItem(key, '1');
				start(name);
			}
		},
		[start],
	);

	const stop = useCallback(() => {
		setRun(false);
		setActive(undefined);
		setStepIndex(0);
	}, []);

	const waitForEl = useCallback(
		(selector: string | Element, { timeout = 2000, interval = 50 } = {}) =>
			new Promise<boolean>((resolve) => {
				const startT = performance.now();
				const tick = () => {
					let found: Element | null | string = selector;

					if (selector === 'body') {
						found = document.body;
					} else if (typeof selector === 'string') {
						found = document.querySelector(selector);
					} else {
						found = selector;
					}

					if (found) return resolve(true);
					if (performance.now() - startT > timeout) return resolve(false);
					setTimeout(tick, interval);
				};
				tick();
			}),
		[],
	);

	const advancingRef = useRef(false);

	const safeAdvanceTo = useCallback(
		async (nextIndex: number) => {
			if (advancingRef.current) return;
			advancingRef.current = true;

			const steps = active ? (registryRef.current[active] ?? []) : [];
			const next = steps[nextIndex];

			if (!next || next.target === 'body') {
				setStepIndex(nextIndex);
				advancingRef.current = false;
				return;
			}

			const ok = await waitForEl(String(next.target), { timeout: 2000 });
			if (ok) setStepIndex(nextIndex);

			advancingRef.current = false;
		},
		[active, waitForEl],
	);

	const callback = useCallback(
		(data: CallBackProps) => {
			const { status, index, type } = data;

			if (type === EVENTS.STEP_AFTER && typeof index === 'number') {
				void safeAdvanceTo(index + 1);
				return;
			}

			if (type === EVENTS.TARGET_NOT_FOUND && typeof index === 'number') {
				void safeAdvanceTo(index + 1);
				return;
			}

			if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
				stop();
				setStepIndex(0);
			}
		},
		[safeAdvanceTo, stop],
	);

	const steps = active ? (registryRef.current[active] ?? []) : [];

	const value = useMemo<Ctx>(
		() => ({
			register,
			start,
			startOnce,
			stop,
			isRunning: run,
			active,
		}),
		[register, start, startOnce, stop, run, active],
	);

	return (
		<TourCtx.Provider value={value}>
			{children}
			<JoyrideNoSSR
				steps={steps}
				run={run}
				stepIndex={stepIndex}
				continuous
				showProgress
				showSkipButton
				hideCloseButton
				scrollToFirstStep
				disableScrolling={false}
				spotlightPadding={0}
				disableOverlayClose
				disableCloseOnEsc
				floaterProps={{
					disableAnimation: true,
					styles: {
						floater: { transition: 'none', position: 'fixed' },
					},
					hideArrow: true,
				}}
				tooltipComponent={GuideTooltip}
				styles={{
					options: { zIndex: 9999, primaryColor: '#1F8FEB' },
					overlay: { transition: 'none' },
					tooltipContainer: { transition: 'none' },
				}}
				locale={{ next: 'Continue', skip: 'Skip guide', last: 'Finish' }}
				callback={callback}
			/>
		</TourCtx.Provider>
	);
}

export function useTour(name?: TourName) {
	const ctx = useContext(TourCtx);
	if (!ctx) throw new Error('useTour must be used within GuideProvider');
	const { register, start, startOnce, stop, isRunning, active } = ctx;
	return {
		register,
		start: () => (name ? start(name) : stop()),
		startOnce: (version?: string) => (name ? startOnce(name, version) : undefined),
		stop,
		isRunning,
		active,
	};
}

export const dataTour = (id: string) => ({ 'data-tour': id }) as const;
