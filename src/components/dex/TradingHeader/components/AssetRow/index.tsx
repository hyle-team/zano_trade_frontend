import { shortenAddress } from '@/utils/utils';
import Link from 'next/link';
import CurrencyIcon from '../CurrencyIcon';
import styles from './styles.module.scss';
import { AssetRowProps } from './types';

const AssetRow = ({ name, link, id, code }: AssetRowProps) => (
	<div className={styles.asset}>
		<p className={styles.asset__name}>
			<CurrencyIcon code={code} size={16} /> {name}:
		</p>
		<Link
			className={styles.asset__address}
			rel="noopener noreferrer"
			target="_blank"
			href={link}
		>
			{shortenAddress(id)}
		</Link>
	</div>
);

export default AssetRow;
