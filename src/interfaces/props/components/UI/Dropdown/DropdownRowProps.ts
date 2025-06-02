import { MouseEventHandler, ReactNode } from 'react';

interface DropdownRowProps {
	header?: boolean;
	search?: boolean;
	selfContained?: boolean;
	className?: string;
	disabled?: boolean;
	children: ReactNode | undefined;
	onClick?: MouseEventHandler;
}

export default DropdownRowProps;
