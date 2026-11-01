import { getAssetIcon, classes } from '@/utils/utils';
import styles from './styles.module.scss';

interface TokenIconProps {
	assetId?: string | null;
	size?: number;
	className?: string;
}

const TokenIcon = ({ assetId, size = 28, className }: TokenIconProps) => (
	<img
		className={classes(styles.icon, className)}
		src={getAssetIcon(String(assetId ?? ''))}
		width={size}
		height={size}
		alt=""
	/>
);

export default TokenIcon;
