import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '@/components/default/Header/Header';
import SiteFooter from '@/components/default/SiteFooter';
import Button from '@/components/UI/Button/Button';
import { classes } from '@/utils/utils';
import { figtree } from '@/utils/font';
import styles from '../styles/404.module.scss';

function NotFound() {
	const router = useRouter();

	return (
		<>
			<Head>
				<title>Page not found | Zano Trade</title>
			</Head>
			<Header />
			<main className={classes(styles.notFound, figtree.variable)}>
				<div className={styles.notFound__card}>
					<p className={styles.notFound__code}>404</p>
					<h1>Page not found</h1>
					<p className={styles.notFound__text}>
						The page you&apos;re looking for doesn&apos;t exist or has been moved.
					</p>
					<Button variant="primary" onClick={() => router.push('/dex')}>
						Go to Swap
					</Button>
				</div>
			</main>
			<SiteFooter />
		</>
	);
}

export default NotFound;
