import React from 'react';
import { classes } from '@/utils/utils';
import { ActionBtnProps } from './types';
import styles from './styles.module.scss';

const ActionBtn = ({ children, variant = 'primary', className, ...props }: ActionBtnProps) => {
	return (
		<button className={classes(styles.btn, className, styles[variant])} {...props}>
			{children}
		</button>
	);
};

export default ActionBtn;
