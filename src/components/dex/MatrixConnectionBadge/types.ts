import MatrixAddress from '@/interfaces/common/MatrixAddress';

export interface MatrixConnectionBadgeProps {
	isSm?: boolean;
	userAdress?: string;
	userAlias?: string;
	matrixAddresses: MatrixAddress[];
}
