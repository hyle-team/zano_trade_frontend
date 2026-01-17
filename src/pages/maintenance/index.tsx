import React from 'react';
import logoImg from '@/assets/images/UI/logo_block.svg?url';
import logoImgWhite from '@/assets/images/UI/logo_block_dark.svg?url';
import useAdvancedTheme from '@/hook/useTheme';
import Image from 'next/image';
import TelegramIcon from '@/assets/images/UI/social/telegram.svg';
import DisconrdIcon from '@/assets/images/UI/social/discord.svg';
import TwitterIcon from '@/assets/images/UI/social/twitter.svg';
import Link from 'next/link';
import styles from './styles.module.scss';

const Maintenance = () => {
	const { theme } = useAdvancedTheme();

	return (
		<main className={styles.main}>
			<Image
				className={styles.main__logo}
				width={242}
				height={48}
				src={theme === 'dark' ? logoImg : logoImgWhite}
				alt="Zano P2P"
			/>

			<div className={styles.main__content}>
				<h1 className={styles.main__content_title}>
					<span>We are updating the website</span>
					<br />
					Sorry for the inconvenience
				</h1>
				<p className={styles.main__content_info}>
					Follow us on social media to stay up to date
				</p>

				<div className={styles.main__content_social}>
					<Link target="_blank" href="https://discord.gg/zano">
						<DisconrdIcon />
					</Link>
					<Link target="_blank" href="https://twitter.com/zano_project">
						<TwitterIcon />
					</Link>
					<Link target="_blank" href="https://t.me/zanocoin">
						<TelegramIcon />
					</Link>
				</div>
			</div>

			<h5 className={styles.main__bgText}>MAINTENANCE</h5>
		</main>
	);
};

export default Maintenance;
