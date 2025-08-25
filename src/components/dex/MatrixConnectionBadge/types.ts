import MatrixAddress from '@/interfaces/common/MatrixAddress';

export interface MatrixConnectionBadgeProps {
	className?: string;
	userAdress?: string;
	userAlias?: string;
	matrixAddresses: MatrixAddress[];
}
