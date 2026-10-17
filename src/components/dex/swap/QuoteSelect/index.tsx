import { useState } from 'react';
import Modal from '@/components/UI/Modal';
import TokenIcon from '@/components/UI/TokenIcon';
import { CheckIcon, ChevronDownIcon } from '@/components/UI/Icons';
import { classes, ZANO_ASSET_ID } from '@/utils/utils';
import rowStyles from '../AssetSelectModal/styles.module.scss';
import styles from './styles.module.scss';

const FUSD_ASSET_ID = '86143388bd056a8f0bab669f78f14873fac8e2dd8d57898cdb725a2d5e2e4f8f';

const QUOTE_OPTIONS = [
	{ ticker: 'ZANO', name: 'Zano', assetId: ZANO_ASSET_ID, disabled: false },
	{ ticker: 'fUSD', name: 'Freedom Dollar', assetId: FUSD_ASSET_ID, disabled: true },
];

const QuoteSelect = () => {
	const [open, setOpen] = useState(false);
	const selected = QUOTE_OPTIONS[0];

	return (
		<>
			<button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
				<TokenIcon assetId={selected.assetId} size={26} />
				<span>{selected.ticker}</span>
				<ChevronDownIcon />
			</button>

			<Modal open={open} onClose={() => setOpen(false)} title="Select asset">
				<div className={styles.list}>
					{QUOTE_OPTIONS.map((option) => {
						const isSelected = option.ticker === selected.ticker;

						return (
							<button
								key={option.ticker}
								type="button"
								disabled={option.disabled}
								className={classes(
									rowStyles.row,
									isSelected && rowStyles.selected,
									option.disabled && styles.disabled,
								)}
								onClick={() => setOpen(false)}
							>
								<TokenIcon assetId={option.assetId} size={36} />

								<div className={rowStyles.row__info}>
									<p className={rowStyles.row__ticker}>
										{option.ticker}
										{option.disabled && (
											<span className={styles.soon}>Soon</span>
										)}
									</p>
									<p className={rowStyles.row__name}>{option.name}</p>
								</div>

								{isSelected && <CheckIcon className={rowStyles.row__check} />}
							</button>
						);
					})}
				</div>
			</Modal>
		</>
	);
};

export default QuoteSelect;
