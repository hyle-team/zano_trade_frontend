import { useEffect, useState, useRef, useMemo } from 'react';
import useAdvancedTheme from '@/hook/useTheme';
import ReactECharts from 'echarts-for-react';
import type CandleChartProps from '@/interfaces/props/pages/dex/trading/CandleChartProps/CandleChartProps';
import styles from './styles.module.scss';
import { ResultCandle } from './types';
import {
	buildCandles,
	d,
	diffFmt,
	fmt,
	pickWindowIndices,
	tsLabel,
	zoomStartByPeriod,
	chartColors,
} from './utils';

function CandleChart(props: CandleChartProps) {
	const { theme } = useAdvancedTheme();
	const chartRef = useRef<ReactECharts>(null);

	const [candles, setCandles] = useState<ResultCandle[]>([]);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		setCandles(buildCandles(props.candles));
		setIsLoaded(true);
	}, [props.candles]);

	// shown candle
	const shownIdx = candles.length ? candles.length - 1 : null;
	const prevIdx = shownIdx && shownIdx > 0 ? shownIdx - 1 : null;

	const shown = shownIdx !== null ? candles[shownIdx] : undefined;
	const prev = prevIdx !== null ? candles[prevIdx] : undefined;

	const O = shown?.[3];
	const H = shown?.[1];
	const L = shown?.[2];
	const C = shown?.[4];
	const P = prev?.[4];
	const delta = diffFmt(C, P);

	const option = useMemo(() => {
		const timestamps = candles.map((c) => c[0]);
		const { startIdx, endIdx } = pickWindowIndices(timestamps, zoomStartByPeriod(props.period));

		return {
			grid: { top: '5%', left: '0%', right: '10%', bottom: '10%' },

			xAxis: {
				type: 'category',
				boundaryGap: true,
				min: 'dataMin',
				max: 'dataMax',
				splitLine: {
					show: true,
					lineStyle: {
						color: theme === 'light' ? chartColors.light : chartColors.dark,
					},
				},
				axisLine: { onZero: false },
				axisLabel: { formatter: (v: string) => tsLabel(parseInt(v, 10)) },
				axisPointer: {
					show: true,
					type: 'line',
					label: {
						formatter: (p: { value: string }) => tsLabel(parseInt(p.value, 10)),
						backgroundColor: chartColors.default,
						color: '#fff',
					},
				},
			},

			yAxis: {
				scale: true,
				position: 'right',
				splitArea: { show: false },
				min: (v: { min: number; max: number }) => {
					const min = d(v.min);
					const range = d(v.max).minus(min);
					const pad = range.lte(0) ? d(v.max).mul(0.05) : range.mul(0.1);
					return min.minus(pad).toNumber();
				},
				max: (v: { min: number; max: number }) => {
					const min = d(v.min);
					const max = d(v.max);
					const range = max.minus(min);
					const pad = range.lte(0) ? max.mul(0.05) : range.mul(0.1);
					return max.plus(pad).toNumber();
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: theme === 'light' ? chartColors.light : chartColors.dark,
					},
				},
				axisLabel: {
					formatter: (val: number | string) => d(val).toDecimalPlaces(6).toString(),
				},
				axisPointer: {
					show: true,
					type: 'line',
					label: {
						show: true,
						color: '#fff',
						backgroundColor: (p: {
							seriesData?: Array<{ value?: (number | string)[] }>;
						}) => {
							const ts = p.seriesData?.[0]?.value?.[0];
							const idx = candles.findIndex((c) => c[0] === ts);
							if (idx === -1) return chartColors.default;
							const [, , , o, c] = candles[idx];
							let color = chartColors.default;

							if (c > o) {
								color = chartColors.green;
							} else if (c < o) {
								color = chartColors.red;
							}

							return color;
						},
					},
				},
			},

			dataZoom: [{ type: 'inside', startValue: startIdx, endValue: endIdx }],

			series: [
				{
					name: 'Candle Chart',
					type: 'candlestick',
					data: candles,
					barWidth: '75%',
					itemStyle: {
						color: chartColors.green,
						color0: chartColors.red,
						borderColor: chartColors.green,
						borderColor0: chartColors.red,
					},
					dimensions: ['date', 'highest', 'lowest', 'open', 'close'],
					encode: { x: 'date', y: ['open', 'close', 'highest', 'lowest'] },
					large: true,
					largeThreshold: 2_000_000,
				},
			],
		};
	}, [candles, props.period, theme]);

	return (
		<div className={styles.chart}>
			{/* Header */}
			<div className={styles.chart__top}>
				<div className={styles.chart__top_item}>
					<p>
						{props.currencyNames.firstCurrencyName}/
						{props.currencyNames.secondCurrencyName}
					</p>
				</div>
				<div className={styles.chart__top_item}>
					<p style={{ opacity: 0.7 }}>O</p>
					<span style={{ color: delta.color }}>{fmt(O)}</span>
				</div>
				<div className={styles.chart__top_item}>
					<span style={{ opacity: 0.7 }}>H</span>
					<span style={{ color: delta.color }}>{fmt(H)}</span>
				</div>
				<div className={styles.chart__top_item}>
					<span style={{ opacity: 0.7 }}>L</span>
					<span style={{ color: delta.color }}>{fmt(L)}</span>
				</div>
				<div className={styles.chart__top_item}>
					<span style={{ opacity: 0.7 }}>C</span>
					<span style={{ color: delta.color }}>{fmt(C)}</span>
				</div>
				<div className={styles.chart__top_item}>
					<p style={{ color: delta.color }}>{delta.txt}</p>
				</div>
			</div>

			<ReactECharts
				ref={chartRef}
				option={option}
				style={{ height: '100%', width: '100%' }}
				opts={{ devicePixelRatio: 2 }}
				lazyUpdate
				notMerge
			/>

			{!candles.length && isLoaded && (
				<h1 className={styles.chart__lowVolume}>[ Low volume ]</h1>
			)}
		</div>
	);
}

export default CandleChart;
