import React from 'react';
import { classes } from '@/utils/utils';
import styles from './styles.module.scss';
import { TabsProps } from './types';

const Tabs = ({ type = 'tab', data, value, setValue }: TabsProps) => {
	return (
		<div className={classes(styles.tabs, styles[type])}>
			{data.map((tab) => (
				<button
					key={tab.type}
					onClick={() => setValue(tab)}
					className={classes(styles.tabs__item, value.type === tab.type && styles.active)}
				>
					{tab.title} {Number.isFinite(tab.length) && <>({tab.length})</>}
				</button>
			))}
		</div>
	);
};

export default Tabs;
