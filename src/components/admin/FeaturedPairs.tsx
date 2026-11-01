import React from 'react';
import Link from 'next/link';
import Button from '@/components/UI/Button/Button';
import TokenIcon from '@/components/UI/TokenIcon';
import { PlusIcon, SearchIcon, TrashIcon } from '@/components/UI/Icons';
import { shortenAddress } from '@/utils/utils';
import Spinner from '@/components/UI/Spinner';
import styles from './styles.module.scss';

interface FeaturedPair {
	name: string;
	assetId?: string;
	key: number;
}

interface FeaturedPairsProps {
	featuredPairs: FeaturedPair[];
	loading: boolean;
	assetId: string;
	setAssetId: (_value: string) => void;
	adding: boolean;
	addFeaturedPair: () => void;
	removeFeaturedPair: (_pair: FeaturedPair) => void;
}

const FeaturedPairs: React.FC<FeaturedPairsProps> = ({
	featuredPairs,
	loading,
	assetId,
	setAssetId,
	adding,
	addFeaturedPair,
	removeFeaturedPair,
}) => {
	const renderList = () => {
		if (loading) {
			return (
				<div className={styles.loader}>
					<Spinner />
				</div>
			);
		}

		if (!featuredPairs.length) {
			return (
				<div className={styles.placeholder}>
					<p>No featured pairs yet</p>
					<span>Add an asset ID above to highlight its pair on the swap page.</span>
				</div>
			);
		}

		return (
			<div className={styles.list}>
				{featuredPairs.map((pair) => (
					<div key={pair.key} className={styles.row}>
						<Link href={`/dex/trading/${pair.key}`} className={styles.row__main}>
							<TokenIcon assetId={pair.assetId} size={36} />
							<div className={styles.row__info}>
								<p className={styles.row__title}>{pair.name}</p>
								<span className={styles.row__subtitle}>
									Pair #{pair.key}
									{pair.assetId && ` · ${shortenAddress(pair.assetId, 6, 6)}`}
								</span>
							</div>
						</Link>

						<Button
							size="sm"
							variant="danger"
							className={styles.row__action}
							aria-label={`Remove ${pair.name} from featured`}
							title="Remove from featured"
							onClick={() => removeFeaturedPair(pair)}
						>
							<TrashIcon />
						</Button>
					</div>
				))}
			</div>
		);
	};

	return (
		<section className={styles.section}>
			<div className={styles.section__head}>
				<div>
					<h2>
						Featured pairs
						{!loading && <span className={styles.count}>{featuredPairs.length}</span>}
					</h2>
					<p>Pairs highlighted on the swap page</p>
				</div>
			</div>

			<form
				className={styles.addForm}
				onSubmit={(e) => {
					e.preventDefault();
					addFeaturedPair();
				}}
			>
				<label className={styles.input}>
					<SearchIcon />
					<input
						placeholder="Enter asset ID"
						value={assetId}
						onChange={(e) => setAssetId(e.target.value)}
					/>
				</label>
				<Button
					type="submit"
					variant="primary"
					size="sm"
					className={styles.addForm__btn}
					loading={adding}
					disabled={!assetId.trim()}
				>
					{!adding && <PlusIcon />}
					Add
				</Button>
			</form>

			{renderList()}
		</section>
	);
};

export default FeaturedPairs;
