import AlertType from '@/interfaces/common/AlertType';
import { ReactNode } from 'react';

interface AlertProps {
	type: AlertType;
	title?: string;
	subtitle?: string;
	close: () => void;
	customIcon?: ReactNode;
	customContent?: ReactNode;
	children?: ReactNode;
}

export default AlertProps;
