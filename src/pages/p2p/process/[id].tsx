import styles from '@/styles/Process.module.scss';
import Header from '@/components/default/Header/Header';
import SiteFooter from '@/components/default/SiteFooter';
import ProcessContent from './components/ProcessContent/ProcessContent';

function Process() {
	return (
		<>
			<Header />
			<main className={styles.main}>
				<ProcessContent />
			</main>
			<SiteFooter />
		</>
	);
}

export default Process;
