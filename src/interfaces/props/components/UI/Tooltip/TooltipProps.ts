import { CSSProperties, ReactNode } from 'react';

interface TooltipProps {
	shown?: boolean;
	style?: CSSProperties;
	className?: string;
	arrowClass?: string;
	children: ReactNode;
}

export default TooltipProps;
