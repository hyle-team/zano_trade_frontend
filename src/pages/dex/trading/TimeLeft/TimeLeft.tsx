import { localeTimeLeft } from '@/utils/utils';
import { useEffect, useState } from 'react';

function TimeLeft(props: { timestamp: string }) {
	const [now, setNow] = useState<number | null>(null);

	useEffect(() => {
		setNow(Date.now());

		const id = setInterval(() => {
			setNow(Date.now());
		}, 1000);

		return () => {
			clearInterval(id);
		};
	}, []);

	return <p>{localeTimeLeft(now, parseInt(props.timestamp, 10))}</p>;
}

export default TimeLeft;
