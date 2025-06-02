import styles from '@/styles/Process.module.scss';
import Header from '@/components/default/Header/Header';
import Footer from '@/components/default/Footer/Footer';
import ProcessContent from './components/ProcessContent/ProcessContent';

function Process() {
	return (
		<>
			<Header />
			<main className={styles.main}>
				<ProcessContent />
			</main>
			<Footer />
		</>
	);
}

export default Process;
