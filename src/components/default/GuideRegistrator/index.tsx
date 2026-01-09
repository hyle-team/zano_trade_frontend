import { useTour } from '@/store/guide-provider';
import { useEffect } from 'react';
import type { Step } from 'react-joyride';

type Props = { name: string; steps: Step[]; autoStartOnceVersion?: string };

export default function GuideRegistrator({ name, steps, autoStartOnceVersion }: Props) {
	const { register, startOnce } = useTour(name);

	useEffect(() => {
		register(name, steps);
		if (autoStartOnceVersion) startOnce(autoStartOnceVersion);
	}, [name, steps, register, startOnce, autoStartOnceVersion]);

	return <></>;
}
