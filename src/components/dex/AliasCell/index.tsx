import { useEffect, useRef, useState } from 'react';
import Tooltip from '@/components/UI/Tooltip/Tooltip';
import { cutAddress } from '@/utils/utils';
import MatrixConnectionBadge from '@/components/dex/MatrixConnectionBadge';
import BadgeStatus from '@/components/dex/BadgeStatus';
import { createPortal } from 'react-dom';
import styles from './styles.module.scss';
import { AliasCellProps } from './types';

export default function AliasCell({
	alias,
	address,
	matrixAddresses,
	isInstant,
	max = 12,
}: AliasCellProps) {
	const display = alias ? cutAddress(alias, max) : 'no alias';

	const [open, setOpen] = useState(false);
	const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
	const anchorRef = useRef<HTMLParagraphElement | null>(null);

	const updatePosition = () => {
		const el = anchorRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		setPos({
			top: rect.bottom + 8,
			left: rect.left + rect.width / 2,
		});
	};

	useEffect(() => {
		if (!open) return;
		updatePosition();
		const onScrollOrResize = () => updatePosition();
		window.addEventListener('scroll', onScrollOrResize, true);
		window.addEventListener('resize', onScrollOrResize);
		return () => {
			window.removeEventListener('scroll', onScrollOrResize, true);
			window.removeEventListener('resize', onScrollOrResize);
		};
	}, [open]);

	return (
		<p ref={anchorRef} className={styles.alias}>
			<span
				onMouseEnter={() => {
					setOpen(true);
					requestAnimationFrame(updatePosition);
				}}
				onMouseLeave={() => setOpen(false)}
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

			{open &&
				pos &&
				createPortal(
					<>
						{alias && alias.length > max && (
							<Tooltip
								style={{
									position: 'fixed',
									top: pos.top,
									left: pos.left,
									transform: 'translateX(-50%)',
									zIndex: 9999,
									pointerEvents: 'auto',
								}}
								className={styles.tooltip}
								arrowClass={styles.tooltip__arrow}
								shown={true}
							>
								<p className={styles.tooltip__text}>{alias}</p>
							</Tooltip>
						)}
					</>,
					document.body,
				)}
		</p>
	);
}
