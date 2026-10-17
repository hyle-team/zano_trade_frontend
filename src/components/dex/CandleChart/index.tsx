import { useEffect, useState, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import useAdvancedTheme from '@/hook/useTheme';
import ReactECharts from 'echarts-for-react';
import type CandleChartProps from '@/interfaces/props/pages/dex/trading/CandleChartProps/CandleChartProps';
import Period from '@/interfaces/common/Period';
import { figtree } from '@/utils/font';
import styles from './styles.module.scss';
import { ResultCandle } from './types';
import {
	INITIAL_VISIBLE_BARS,
	axisLabel,
	buildCandles,
	buildTickIndices,
	buildTimeline,
	candleColor,
	chartColors,
	d,
	diffFmt,
	fmtPrice,
	pickTickStep,
	pointerLabel,
	pricePrecision,
	tickStepKey,
} from './utils';

interface PriceLineData {
	yAxis: number;
}

interface ChartContext {
	timeline: number[];
	period: Period;
	start: number;
	end: number;
	stepKey: string;
	lastIdx: number;
	priceLineShown: boolean;
	priceLineData: PriceLineData[];
	yAxisWidth: number;
}

interface DataZoomEvent {
	start?: number;
	end?: number;
	batch?: { start?: number; end?: number }[];
}

interface AxisPointerEvent {
	axesInfo?: { axisDim: string; value: number }[];
}

function CandleChart(props: CandleChartProps) {
	const { theme } = useAdvancedTheme();
	const chartRef = useRef<ReactECharts>(null);
	const bodyRef = useRef<HTMLDivElement>(null);
	const [candles, setCandles] = useState<ResultCandle[]>([]);
	const [isLoaded, setIsLoaded] = useState(false);
	const [hoverIdx, setHoverIdx] = useState<number | null>(null);
	const ctxRef = useRef<ChartContext>({
		timeline: [],
		period: props.period,
		start: 0,
		end: 100,
		stepKey: '',
		lastIdx: -1,
		priceLineShown: true,
		priceLineData: [],
		yAxisWidth: 70,
	});

	useEffect(() => {
		setCandles(buildCandles(props.candles));
		setHoverIdx(null);
		setIsLoaded(true);
	}, [props.candles]);

	const lastIdx = candles.length - 1;
	const last = candles[lastIdx];
	const shownIdx = hoverIdx !== null && hoverIdx <= lastIdx ? hoverIdx : lastIdx;
	const shown = candles[shownIdx];
	const prev = shownIdx > 0 ? candles[shownIdx - 1] : undefined;
	const precision = pricePrecision(last?.[4] || last?.[1]);
	const delta = diffFmt(shown?.[4], prev?.[4], precision);
	const shownColor = candleColor(shown);
	const hasData = candles.some((c) => c[1] > 0);

	const chart = useMemo(() => {
		const { period } = props;
		const timeline = buildTimeline(candles, period);
		const endIdx = Math.max(timeline.length - 1, 0);
		const startIdx = Math.max(0, candles.length - INITIAL_VISIBLE_BARS);
		const span = Math.max(endIdx, 1);
		const lastCandle = candles[candles.length - 1];
		const lastColor = candleColor(lastCandle);
		const prec = pricePrecision(lastCandle?.[4] || lastCandle?.[1]);
		const maxHigh = candles.reduce((max, c) => Math.max(max, c[1]), 0);
		const priceLineData: PriceLineData[] =
			lastCandle && maxHigh > 0 ? [{ yAxis: lastCandle[4] }] : [];
		const yAxisWidth = Math.max(fmtPrice(maxHigh * 1.2, prec).length, 4) * 7 + 22;

		const width = (bodyRef.current?.clientWidth || 800) - yAxisWidth;
		const step = pickTickStep(period, endIdx - startIdx + 1, width);
		const ticks = buildTickIndices(timeline, period, step);

		const isLight = theme === 'light';
		const gridColor = isLight ? chartColors.light : chartColors.dark;
		const axisText = isLight ? chartColors.axisTextLight : chartColors.axisTextDark;
		const pointerLine = isLight ? chartColors.pointerLineLight : chartColors.pointerLineDark;

		const pointerLabelStyle = {
			backgroundColor: chartColors.default,
			color: chartColors.textColor,
			padding: [4, 6],
			borderRadius: 2,
			fontSize: 11,
		};

		const option = {
			animation: false,
			textStyle: { fontFamily: figtree.style.fontFamily, fontSize: 11 },
			grid: { top: 12, left: 8, right: yAxisWidth, bottom: 28 },

			tooltip: {
				trigger: 'axis',
				showContent: false,
				axisPointer: {
					type: 'cross',
					lineStyle: { color: pointerLine, type: 'dashed', width: 1 },
					crossStyle: { color: pointerLine, type: 'dashed', width: 1 },
				},
			},

			xAxis: {
				type: 'category',
				data: timeline.map(String),
				boundaryGap: true,
				axisLine: { lineStyle: { color: gridColor } },
				axisTick: { show: false, customValues: ticks },
				axisLabel: {
					color: axisText,
					margin: 10,
					hideOverlap: true,
					customValues: ticks,
					formatter: (v: string) => axisLabel(Number(v), period),
				},
				splitLine: {
					show: true,
					alignWithLabel: true,
					lineStyle: { color: gridColor },
				},
				axisPointer: {
					label: {
						...pointerLabelStyle,
						formatter: (p: { value: string }) => pointerLabel(Number(p.value), period),
					},
				},
			},

			yAxis: {
				type: 'value',
				scale: true,
				position: 'right',
				splitNumber: 6,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					color: axisText,
					margin: 16,
					formatter: (v: number) => fmtPrice(v, prec),
				},
				splitLine: { show: true, lineStyle: { color: gridColor } },
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
				axisPointer: {
					label: {
						...pointerLabelStyle,
						formatter: (p: { value: number }) => fmtPrice(p.value, prec),
					},
				},
			},

			dataZoom: [
				{
					type: 'inside',
					startValue: startIdx,
					endValue: endIdx,
					minValueSpan: 10,
				},
			],

			series: [
				{
					name: 'Candle Chart',
					type: 'candlestick',
					data: candles.map((c) => [c[3], c[4], c[2], c[1]]),
					barWidth: '70%',
					itemStyle: {
						color: chartColors.green,
						color0: chartColors.red,
						borderColor: chartColors.green,
						borderColor0: chartColors.red,
						borderColorDoji: chartColors.green,
					},
					markLine: {
						silent: true,
						animation: false,
						symbol: ['none', 'none'],
						data: priceLineData,
						lineStyle: { type: 'dashed', width: 1, color: lastColor },
						label: {
							position: 'end',
							distance: 4,
							formatter: () => fmtPrice(lastCandle?.[4], prec),
							color: '#0C0C3A',
							backgroundColor: lastColor,
							padding: [3, 5],
							borderRadius: 2,
							fontSize: 11,
						},
					},
				},
			],
		};

		return {
			option,
			context: {
				timeline,
				period,
				start: (startIdx / span) * 100,
				end: 100,
				stepKey: tickStepKey(step),
				lastIdx: candles.length - 1,
				priceLineShown: true,
				priceLineData,
				yAxisWidth,
			},
		};
	}, [candles, props.period, theme]);

	const syncChart = useCallback(() => {
		const instance = chartRef.current?.getEchartsInstance();
		const ctx = ctxRef.current;
		if (!instance || !ctx.timeline.length) return;

		const span = ctx.timeline.length - 1;
		const from = (ctx.start / 100) * span;
		const to = (ctx.end / 100) * span;
		const width = (bodyRef.current?.clientWidth || 800) - ctx.yAxisWidth;
		const step = pickTickStep(ctx.period, to - from + 1, width);
		const stepKey = tickStepKey(step);
		const priceLineShown = ctx.lastIdx >= Math.floor(from) && ctx.lastIdx <= Math.ceil(to);

		const patch: Record<string, unknown> = {};

		if (stepKey !== ctx.stepKey) {
			const ticks = buildTickIndices(ctx.timeline, ctx.period, step);
			patch.xAxis = {
				axisLabel: { customValues: ticks },
				axisTick: { customValues: ticks },
			};
			ctx.stepKey = stepKey;
		}

		if (priceLineShown !== ctx.priceLineShown) {
			patch.series = [{ markLine: { data: priceLineShown ? ctx.priceLineData : [] } }];
			ctx.priceLineShown = priceLineShown;
		}

		if (Object.keys(patch).length) instance.setOption(patch);
	}, []);

	useEffect(() => {
		ctxRef.current = { ...chart.context };
		syncChart();
	}, [chart, syncChart]);

	useEffect(() => {
		const el = bodyRef.current;
		if (!el) return undefined;
		const observer = new ResizeObserver(() => syncChart());
		observer.observe(el);
		return () => observer.disconnect();
	}, [syncChart]);

	useLayoutEffect(() => {
		requestAnimationFrame(() => {
			window.dispatchEvent(new Event('resize'));
		});
	}, []);

	const onEvents = useMemo(
		() => ({
			datazoom: (params: DataZoomEvent) => {
				const range = params.batch?.[0] ?? params;
				if (range.start === undefined || range.end === undefined) return;
				ctxRef.current.start = range.start;
				ctxRef.current.end = range.end;
				syncChart();
			},
			updateAxisPointer: (params: AxisPointerEvent) => {
				const xInfo = params.axesInfo?.find((info) => info.axisDim === 'x');
				setHoverIdx(xInfo ? xInfo.value : null);
			},
			globalout: () => setHoverIdx(null),
		}),
		[syncChart],
	);

	return (
		<div className={styles.chart}>
			<div className={styles.chart__top}>
				<div className={styles.chart__top_item}>
					<p>
						{props.currencyNames.firstCurrencyName}/
						{props.currencyNames.secondCurrencyName}
					</p>
				</div>
				{shown && (
					<div className={styles.chart__top_item}>
						<span className={styles.chart__top_label}>
							{pointerLabel(shown[0], props.period)}
						</span>
					</div>
				)}
				<div className={styles.chart__top_item}>
					<span className={styles.chart__top_label}>O</span>
					<span style={{ color: shownColor }}>{fmtPrice(shown?.[3], precision)}</span>
				</div>
				<div className={styles.chart__top_item}>
					<span className={styles.chart__top_label}>H</span>
					<span style={{ color: shownColor }}>{fmtPrice(shown?.[1], precision)}</span>
				</div>
				<div className={styles.chart__top_item}>
					<span className={styles.chart__top_label}>L</span>
					<span style={{ color: shownColor }}>{fmtPrice(shown?.[2], precision)}</span>
				</div>
				<div className={styles.chart__top_item}>
					<span className={styles.chart__top_label}>C</span>
					<span style={{ color: shownColor }}>{fmtPrice(shown?.[4], precision)}</span>
				</div>
				<div className={styles.chart__top_item}>
					<span style={{ color: delta.color }}>{delta.txt}</span>
				</div>
			</div>

			<div ref={bodyRef} className={styles.chart__body}>
				<ReactECharts
					ref={chartRef}
					option={chart.option}
					style={{ height: '100%', width: '100%' }}
					opts={{ devicePixelRatio: 2 }}
					onEvents={onEvents}
					lazyUpdate
					notMerge
				/>
			</div>

			{!hasData && isLoaded && <p className={styles.chart__lowVolume}>Low volume</p>}
		</div>
	);
}

export default CandleChart;
