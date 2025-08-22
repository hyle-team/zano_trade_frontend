import { useState } from 'react';
import Tooltip from '@/components/UI/Tooltip/Tooltip';
import { cutAddress } from '@/utils/utils';
import MatrixConnectionBadge from '@/components/dex/MatrixConnectionBadge';
import BadgeStatus from '@/components/dex/BadgeStatus';
import styles from '../../styles.module.scss';
import { AliasCellProps } from './types';

export default function AliasCell({
	alias,
	address,
	matrixAddresses,
	isInstant,
	max = 12,
}: AliasCellProps) {
	const [show, setShow] = useState(false);
	const display = alias ? cutAddress(alias, max) : 'no alias';

	return (
		<p className={styles.alias}>
			<span
				onMouseEnter={() => setShow(true)}
				onMouseLeave={() => setShow(false)}
				className={styles.alias__text}
			>
				@{display}
			</span>

			<MatrixConnectionBadge
				userAdress={address}
				userAlias={alias}
				matrixAddresses={matrixAddresses}
			/>
			{isInstant && (
				<div style={{ marginLeft: 2 }}>
					<BadgeStatus type="instant" icon />
				</div>
			)}

			{alias && alias.length > max && (
				<Tooltip className={styles.tooltip} arrowClass={styles.tooltip__arrow} shown={show}>
					<p className={styles.tooltip__text}>{alias}</p>
				</Tooltip>
			)}
		</p>
	);
}
