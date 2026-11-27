import React from 'react';
import NoOffersIcon from '@/assets/images/UI/no_offers.svg';
import { classes } from '@/utils/utils';
import styles from './styles.module.scss';
import { EmptyMessageProps } from './types';

const EmptyMessage = ({ text, customIcon }: EmptyMessageProps) => {
	return (
		<div className={classes(styles.empty, styles.all__orders__msg)}>
			<span className={classes(styles.empty__icon, 'no-svg-style')}>
				{!customIcon ? <NoOffersIcon width={22} height={21} /> : customIcon}
			</span>
			<p className={styles.empty__text}>{text}</p>
		</div>
	);
};

export default EmptyMessage;
