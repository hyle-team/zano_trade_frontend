import React from 'react';
import PairData from '@/interfaces/common/PairData';
import styles from './PairsList.module.scss';
import PairsCard from '../PairsCard/PairsCard';

interface IProps {
	data: PairData[];
	initialZanoUsd: number | null;
}

export default function PairsList({ data, initialZanoUsd }: IProps) {
	return (
		<div className={styles.list}>
			{data.map((pair) => (
				<PairsCard key={pair.id} pair={pair} initialZanoUsd={initialZanoUsd} />
			))}
		</div>
	);
}
