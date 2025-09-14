import Tooltip from '@/components/UI/Tooltip/Tooltip';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReactComponent as ConnectionIcon } from '@/assets/images/UI/connection.svg';
import { classes } from '@/utils/utils';
import styles from './styles.module.scss';
import { MatrixConnectionBadgeProps } from './types';

function MatrixConnectionBadge({
	userAdress,
	userAlias,
	matrixAddresses,
	isSm,
}: MatrixConnectionBadgeProps) {
	const hasConnection = (address: string) =>
		matrixAddresses.some((item) => item.address === address && item.registered);

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

	if (!userAdress || !hasConnection(userAdress)) return <></>;

	return (
		<div className={classes(styles.badge, isSm && styles.sm)}>
			<p
				ref={anchorRef}
				onClick={(e) => {
					e.preventDefault();
					window.open(`https://matrix.to/#/@${userAlias}:zano.org`);
				}}
				onMouseEnter={() => {
					setOpen(true);
					requestAnimationFrame(updatePosition);
				}}
				onMouseLeave={() => setOpen(false)}
				className={styles.badge__link}
			>
				<ConnectionIcon />
			</p>

			{open &&
				pos &&
				createPortal(
					<Tooltip
						style={{
							position: 'fixed',
							top: pos.top,
							left: pos.left,
							transform: 'translateX(-50%)',
							zIndex: 9999,
							pointerEvents: 'auto',
						}}
						className={styles.badge__tooltip}
						arrowClass={styles.badge__tooltip_arrow}
						shown={true}
					>
						<p className={styles.badge__tooltip_text}>Matrix connection</p>
					</Tooltip>,
					document.body,
				)}
		</div>
	);
}

export default MatrixConnectionBadge;
