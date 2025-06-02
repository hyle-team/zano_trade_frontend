import { Dispatch, SetStateAction } from 'react';

interface PaginationProps {
	totalPages: number;
	value: number;
	setValue: Dispatch<SetStateAction<number>>;
}

export default PaginationProps;
