import { FC } from 'react';

interface StatItemProps {
	Img: FC;
	title: string;
	value: string;
	coefficient?: number;
	className?: string;
}

export default StatItemProps;
