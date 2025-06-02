import { CSSProperties, ReactNode } from 'react';

interface ButtonProps {
	children: ReactNode;
	style?: CSSProperties;
	onClick?: () => void;
	transparent?: boolean;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	disabled?: boolean;
	className?: string;
	noBorder?: boolean;
}

export default ButtonProps;
