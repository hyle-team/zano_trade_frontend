import { ReactNode } from 'react';

export interface TooltipWrapperProps {
	children: ReactNode;
	text: string;
	className?: string;
	placement?: 'top' | 'bottom';
}
