import React from 'react';
import Spinner from '@/components/UI/Spinner';
import { classes } from '@/utils/utils';
import { ActionBtnProps } from './types';
import styles from './styles.module.scss';

const ActionBtn = ({
	children,
	variant = 'primary',
	className,
	loading,
	disabled,
	...props
}: ActionBtnProps) => {
	return (
		<button
			className={classes(styles.btn, className, styles[variant])}
			disabled={disabled || loading}
			{...props}
		>
			{loading && <Spinner size="sm" className={styles.btn__spinner} />}
			{children}
		</button>
	);
};

export default ActionBtn;
