import CandleRow from '@/interfaces/common/CandleRow';
import Period from '@/interfaces/common/Period';

interface CandleChartProps {
	candles: CandleRow[];
	period: Period;
}

export default CandleChartProps;
