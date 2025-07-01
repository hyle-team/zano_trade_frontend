import { useEffect, useState, useRef, useMemo } from 'react';
import useAdvancedTheme from '@/hook/useTheme';
import CandleChartProps from '@/interfaces/props/pages/dex/trading/CandleChartProps/CandleChartProps';
import ReactECharts from 'echarts-for-react';
import Decimal from 'decimal.js';
import * as echarts from 'echarts';
import CandleRow from '@/interfaces/common/CandleRow';
import testCandles from './testCandles.json';
import styles from './CandleChart.module.scss';

const TESTING_MODE = false;

function CandleChart(props: CandleChartProps) {
	type ResultCandle = [number, number, number, number, number];

	const { theme } = useAdvancedTheme();
	const chartRef = useRef(null);
	const upColor = '#16D1D6cc';
	const upBorderColor = '#16D1D6cc';
	const downColor = '#ff6767cc';
	const downBorderColor = '#ff6767cc';

	const [candles, setCandles] = useState<ResultCandle[]>([]);
	const [isLoaded, setIsLoaded] = useState(false);

	function timestampToString(timestamp: string) {
		const targetPattern =
			new Date(parseInt(timestamp, 10)).toDateString() === new Date().toDateString()
				? 'hh:mm:ss'
				: 'hh:mm:ss\ndd-MM-yyyy';

		return echarts.format.formatTime(targetPattern, parseInt(timestamp, 10));
	}

	function prepareCandles() {
		const candles = (TESTING_MODE ? (testCandles as CandleRow[]) : props.candles)
			.map((candle) => {
				const result = [
					parseInt(candle.timestamp, 10),
					candle.shadow_top || 0,
					candle.shadow_bottom || 0,
					candle.body_first || 0,
					candle.body_second || 0,
				];

				return result as ResultCandle;
			})
			.filter((e) => e[0])
			.map((e) => {
				const decimals = e.map((el, i) => ({
					value: i !== 0 ? new Decimal(el) : undefined,
					index: i,
				}));

				for (const decimal of decimals) {
					if (decimal.value !== undefined) {
						if (decimal.value.lessThan(0.00001)) {
							e[decimal.index] = 0;
						}
					}
				}

				return e;
			});

		return candles;
	}

	useEffect(() => {
		const newCandles = prepareCandles();

		setCandles(newCandles);
		setIsLoaded(true);
	}, [props.candles]);

	const option = useMemo(() => {
		function splitData(rawData: ResultCandle[]) {
			const categoryData = [];
			const values = [];
			for (let i = 0; i < rawData.length; i++) {
				categoryData.push(rawData[i][0]);
				values.push(rawData[i].slice(1));
			}
			return {
				categoryData,
				values,
			};
		}

		const data0 = splitData(candles);

		const now = new Date().getTime();
		const zoomStartTime = (() => {
			const date = +new Date();
			const hr1 = 60 * 60 * 1000;

			const hoursDecrement = 24 * hr1;
			const daysDecrement = 7 * 24 * hr1;
			const weeksDecrement = 4 * 7 * 24 * hr1;
			const monthsDecrement = 52 * 7 * 24 * hr1;

			switch (props.period) {
			case '1h':
				return date - hoursDecrement;
			case '1d':
				return date - daysDecrement;
			case '1w':
				return date - weeksDecrement;
			case '1m':
				return date - monthsDecrement;
			default:
				return date - hr1;
			}
		})();

		const closestDateToStart = data0.categoryData.reduce((acc, curr) => {
			const currDiff = Math.abs(curr - zoomStartTime);
			const accDiff = Math.abs(acc - zoomStartTime);

			return currDiff < accDiff ? curr : acc;
		}, now);

		const lastDate = data0.categoryData[data0.categoryData.length - 1];

		const closestDateIndex = data0.categoryData.indexOf(closestDateToStart);
		const lastDateIndex = data0.categoryData.indexOf(lastDate);

		return {
			grid: {
				top: '5%',
				left: '10%',
				right: '5%',
				bottom: '10%',
			},

			xAxis: {
				type: 'category',
				data: data0.categoryData,
				boundaryGap: true,
				axisLine: { onZero: false },
				splitLine: {
					show: true,
					lineStyle: {
						color: theme === 'light' ? '#e3e3e8' : '#1f1f4a',
					},
				},
				min: 'dataMin',
				max: 'dataMax',
				axisPointer: {
					show: true,
					type: 'line',
					label: {
						formatter: (params: { value: string }) => timestampToString(params.value),
						backgroundColor: '#4A90E2',
						color: '#ffffff',
					},
				},
				axisLabel: {
					formatter: timestampToString,
				},
			},
			yAxis: {
				scale: true,
				splitArea: { show: false },
				min: 0,
				max: (value: { max: string }) => new Decimal(value.max).mul(1.1).toNumber(),
				axisPointer: {
					show: true,
					type: 'line',
					label: {
						show: true,
						backgroundColor: '#4A90E2',
						color: '#ffffff',
					},
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: theme === 'light' ? '#e3e3e8' : '#1f1f4a',
					},
				},
			},
			dataZoom: [
				{
					type: 'inside',
					startValue: closestDateIndex,
					endValue: lastDateIndex,
				},
			],
			series: [
				{
					name: 'Candle Chart',
					type: 'candlestick',
					data: data0.values,
					itemStyle: {
						color: upColor,
						color0: downColor,
						borderColor: upBorderColor,
						borderColor0: downBorderColor,
					},
					barWidth: '75%',
					dimensions: ['date', 'highest', 'lowest', 'open', 'close'],
					encode: {
						x: 'date',
						y: ['open', 'close', 'highest', 'lowest'],
					},
					large: true,
					largeThreshold: 2000000,
				},
			],
		};
	}, [candles, theme]);

	return (
		<div className={styles.candle__chart__wrapper}>
			<ReactECharts
				option={option}
				style={{
					height: '515px',
					width: '100%',
				}}
				opts={{
					devicePixelRatio: 2,
				}}
				lazyUpdate={true}
				notMerge={true}
				ref={chartRef}
			/>

			{!candles?.length && isLoaded && <h1>[ Low volume ]</h1>}
		</div>
	);
}

export default CandleChart;
