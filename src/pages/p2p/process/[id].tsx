import styles from '@/styles/Process.module.scss';
import Header from '@/components/default/Header/Header';
import { Footer } from '@/zano_ui/src';
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
