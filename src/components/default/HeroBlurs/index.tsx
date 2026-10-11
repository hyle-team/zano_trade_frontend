import { useRouter } from 'next/router';
import styles from './styles.module.scss';

const HIDDEN_ON = ['/dex/trading/[id]'];

const HeroBlurs = () => {
	const router = useRouter();

	if (HIDDEN_ON.includes(router.pathname)) return null;

	return (
		<div className={styles.blurs} aria-hidden="true">
			<div />
			<div />
			<div />
		</div>
	);
};

export default HeroBlurs;
