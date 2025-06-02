import Point from '@/interfaces/common/Point';

interface CurvePairChartProps {
	data: Point[];
	isAscending: boolean;
	className?: string;
	minLength?: number;
}

export default CurvePairChartProps;
