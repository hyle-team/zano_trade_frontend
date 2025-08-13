import Image from 'next/image';
import { getAssetIcon } from '@/utils/utils';
import { CurrencyIconProps } from './types';

const CurrencyIcon = ({ code, size = 50 }: CurrencyIconProps) => (
	<Image width={size} height={size} src={getAssetIcon(String(code))} alt="currency" />
);

export default CurrencyIcon;
