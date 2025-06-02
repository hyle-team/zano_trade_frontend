import { ReactNode } from 'react';
import styles from './PageTitle.module.scss';
import BackButton from '../BackButton/BackButton';

function PageTitle(props: { children: ReactNode }) {
	return (
		<div className={styles.page_title}>
			<div>{props.children}</div>
			<BackButton />
		</div>
	);
}

export default PageTitle;
