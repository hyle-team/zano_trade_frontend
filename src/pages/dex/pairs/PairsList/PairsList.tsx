import React from 'react';
import PairData from '@/interfaces/common/PairData';
import styles from './PairsList.module.scss';
import PairsCard from '../PairsCard/PairsCard';

interface IProps {
	data: PairData[];
}

export default function PairsList({ data }: IProps) {
	return (
		<div className={styles.list}>
			{data.map((pair) => (
				<PairsCard key={pair.id} pair={pair} />
			))}
		</div>
	);
}
