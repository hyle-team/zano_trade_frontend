import React from 'react';
import NoOffersIcon from '@/assets/images/UI/no_offers.svg';
import { classes } from '@/utils/utils';
import styles from './styles.module.scss';
import { EmptyMessageProps } from './types';

const EmptyMessage = ({ text, customIcon }: EmptyMessageProps) => {
	return (
		<div className={classes(styles.empty, styles.all__orders__msg)}>
			{!customIcon ? <NoOffersIcon className={styles.empty__icon} /> : customIcon}
			<h6 className={styles.empty__text}>{text}</h6>
		</div>
	);
};

export default EmptyMessage;
