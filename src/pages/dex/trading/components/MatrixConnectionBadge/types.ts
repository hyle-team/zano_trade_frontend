import MatrixAddress from '@/interfaces/common/MatrixAddress';

export interface MatrixConnectionBadgeProps {
	userAdress?: string;
	userAlias?: string;
	matrixAddresses: MatrixAddress[];
}
