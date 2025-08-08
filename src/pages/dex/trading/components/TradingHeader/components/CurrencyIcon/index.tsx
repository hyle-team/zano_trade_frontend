import Image from 'next/image';
import { CurrencyIconProps } from './types';

const CurrencyIcon = ({ code, size = 50 }: CurrencyIconProps) => (
	<Image width={size} height={size} src={`/currencies/trade_${code}.svg`} alt="currency" />
);

export default CurrencyIcon;
