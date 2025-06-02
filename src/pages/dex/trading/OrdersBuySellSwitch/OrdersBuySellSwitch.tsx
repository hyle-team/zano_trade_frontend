import HorizontalSelectProps from '@/interfaces/props/components/UI/HorizontalSelect/HorizontalSelectProps';
import { ReactComponent as ArrowIcon } from '@/assets/images/UI/trade_arrow.svg';
import SelectValue from '@/interfaces/states/pages/dex/trading/InputPanelItem/SelectValue';
import { classes } from '@/utils/utils';
import styles from './OrdersBuySellSwitch.module.scss';

export default function OrdersBuySellSwitch({
	body,
	value,
	setValue,
	className,
}: HorizontalSelectProps<SelectValue>) {
	const defaultValue = body[0];

	const buyValue = body.find((e) => e.code === 'buy');
	const sellValue = body.find((e) => e.code === 'sell');

	const isBuy = value.code === 'buy';

	return (
		<button
			className={classes(
				styles['orders-buy-sell-switch'],
				isBuy ? styles['orders-buy-sell-switch_sell'] : undefined,
				className,
			)}
			onClick={() => setValue((isBuy ? sellValue : buyValue) || defaultValue)}
		>
			<p>To {isBuy ? 'Sell' : 'Buy'} Orders</p>
			<ArrowIcon />
		</button>
	);
}
