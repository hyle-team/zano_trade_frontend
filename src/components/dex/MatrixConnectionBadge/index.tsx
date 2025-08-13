import Tooltip from '@/components/UI/Tooltip/Tooltip';
import { useState } from 'react';
import { ReactComponent as ConnectionIcon } from '@/assets/images/UI/connection.svg';
import styles from './styles.module.scss';
import { MatrixConnectionBadgeProps } from './types';

function MatrixConnectionBadge({
	userAdress,
	userAlias,
	matrixAddresses,
}: MatrixConnectionBadgeProps) {
	const hasConnection = (address: string) =>
		matrixAddresses.some((item) => item.address === address && item.registered);

	const [connectionTooltip, setConnectionTooltip] = useState(false);
	return userAdress && hasConnection(userAdress) ? (
		<div className={styles.badge}>
			<a
				href={`https://matrix.to/#/@${userAlias}:zano.org`}
				target="_blank"
				onMouseEnter={() => setConnectionTooltip(true)}
				onMouseLeave={() => setConnectionTooltip(false)}
				className={styles.badge__link}
			>
				<ConnectionIcon />
			</a>

			<Tooltip
				className={styles.badge__tooltip}
				arrowClass={styles.badge__tooltip_arrow}
				shown={connectionTooltip}
			>
				<p className={styles.badge__tooltip_text}>Matrix connection</p>
			</Tooltip>
		</div>
	) : (
		<></>
	);
}

export default MatrixConnectionBadge;
