import { CSSProperties, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

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
	variant?: ButtonVariant;
	size?: 'md' | 'sm';
	block?: boolean;
	loading?: boolean;
	type?: 'button' | 'submit' | 'reset';
	title?: string;
	'aria-label'?: string;
}

export default ButtonProps;
