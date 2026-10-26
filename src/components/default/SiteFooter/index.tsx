import { NewFooter } from '@/zano_ui/src';
import { classes } from '@/utils/utils';
import { figtree } from '@/utils/font';
import styles from './styles.module.scss';

const SiteFooter = () => (
	<div className={classes(styles.footer, figtree.variable, 'no-svg-style')}>
		<NewFooter />
	</div>
);

export default SiteFooter;
