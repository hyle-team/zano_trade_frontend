import { ReactNode } from 'react';

export interface OrderRowTooltipCellProps {
	style?: React.CSSProperties;
	children: string | ReactNode;
	sideText?: string;
	sideTextColor?: string;
	noTooltip?: boolean;
}
