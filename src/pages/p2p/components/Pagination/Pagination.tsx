import paginationArrowIcon from '@/assets/images/UI/pagination_arrow.svg?url';
import Button from '@/components/UI/Button/Button';
import { nanoid } from 'nanoid';
import PaginationProps from '@/interfaces/props/pages/p2p/components/Pagination/PaginationProps';
import styles from './Pagination.module.scss';

function Pagination(props: PaginationProps) {
	function generateButton(value: number, selected = false, hiding: 1 | 2 | 3 | null = null) {
		let className = '';
		if (hiding === 1) className = styles.hiding__first;
		else if (hiding === 2) className = styles.hiding__second;
		else if (hiding === 3) className = styles.hiding__third;

		return (
			<Button
				key={nanoid(16)}
				onClick={() => {
					props.setValue(value);
				}}
				className={className}
				transparent={!selected}
			>
				{value}
			</Button>
		);
	}

	function generateArrowButton(forward: boolean) {
		return (
			<Button
				key={nanoid(16)}
				onClick={() => {
					if (forward ? props.value < props.totalPages : props.value > 1) {
						props.setValue(forward ? props.value + 1 : props.value - 1);
					}
				}}
				className={styles.pagination__arrow_btn}
				transparent={true}
			>
				<img
					className={forward ? styles.reversed_img : ''}
					src={paginationArrowIcon}
					alt="arrow"
				></img>
			</Button>
		);
	}

	function getPagination() {
		const result = [];

		if (props.totalPages <= 5) {
			for (let i = 1; i <= props.totalPages; i += 1) {
				let hiding: 1 | 2 | 3 | null = null;
				if (i === 5) hiding = 1;
				else if (i === 4) hiding = 2;

				result.push(generateButton(i, i === props.value, hiding));
			}
		} else if (props.value <= 3) {
			for (let i = 1; i <= 5; i += 1) {
				let hiding: 1 | 2 | 3 | null = null;
				if (i === 5) hiding = 1;
				else if (i === 4) hiding = 2;
				else if (i === 3) hiding = 3;

				result.push(generateButton(i, i === props.value, hiding));
			}
			result.push(<p key={nanoid(16)}>...</p>, generateButton(props.totalPages, false));
		} else if (props.value >= props.totalPages - 2) {
			result.push(generateButton(1, false), <p key={nanoid(16)}>...</p>);
			for (let i = props.totalPages - 4; i <= props.totalPages; i += 1) {
				let hiding: 1 | 2 | 3 | null = null;
				if (i === props.totalPages - 4) hiding = 1;
				else if (i === props.totalPages - 3) hiding = 2;
				else if (i === props.totalPages - 2) hiding = 3;

				result.push(generateButton(i, i === props.value, hiding));
			}
		} else {
			result.push(
				generateButton(1, false),
				<p key={nanoid(16)}>...</p>,
				generateButton(props.value - 1, false, 1),
				generateButton(props.value, true),
				generateButton(props.value + 1, false, 1),
				<p key={nanoid(16)}>...</p>,
				generateButton(props.totalPages, false),
			);
		}

		result.unshift(generateArrowButton(false));
		result.push(generateArrowButton(true));

		return result;
	}

	return <div className={styles.marketplace__pagination}>{getPagination()}</div>;
}

export default Pagination;
