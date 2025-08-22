import MatrixAddress from '@/interfaces/common/MatrixAddress';

export interface AliasCellProps {
	alias?: string;
	address?: string;
	matrixAddresses: MatrixAddress[];
	isInstant?: boolean;
	max?: number;
}
