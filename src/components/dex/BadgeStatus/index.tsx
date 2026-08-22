import { classes } from '@/utils/utils';
import React from 'react';
import Image from 'next/image';
import LightningImg from '@/assets/images/UI/lightning.png';
import RocketImg from '@/assets/images/UI/rocket.png';
import styles from './styles.module.scss';
import { BadgeStatusProps } from './types';

function BadgeStatus({ type, icon, className }: BadgeStatusProps) {
	return (
		<span
			className={classes(
				styles.badge,
				type === 'high' && styles.high,
				icon && styles.icon,
				className,
			)}
		>
			<Image
				className={styles.badge__img}
				src={type === 'instant' ? LightningImg : RocketImg}
				alt="badge image"
			/>
			{!icon && (
				<span className={styles.badge__text}>
					{type === 'instant' ? 'instant' : 'high volume'}
				</span>
			)}
		</span>
	);
}

export default BadgeStatus;
