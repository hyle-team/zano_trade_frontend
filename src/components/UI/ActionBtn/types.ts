import { ButtonHTMLAttributes } from 'react';

export interface ActionBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'success' | 'danger';
}
