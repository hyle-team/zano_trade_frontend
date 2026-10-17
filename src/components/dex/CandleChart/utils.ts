import CandleRow from '@/interfaces/common/CandleRow';
import Period from '@/interfaces/common/Period';
import Decimal from 'decimal.js';
import { ResultCandle } from './types';
import testCandles from './testCandles.json';

export const TESTING_MODE = false;

export const chartColors = {
	green: '#18C8D9',
	red: '#FF5C5C',
	neutral: '#8D95AE',
	default: '#3D3D6C',
	light: '#e3e3e8',
	dark: '#1f1f4a',
	textColor: '#ffffff',
	axisTextDark: 'rgba(141, 149, 174, 1)',
	axisTextLight: 'rgba(12, 12, 58, 0.6)',
	pointerLineDark: 'rgba(141, 149, 174, 0.6)',
	pointerLineLight: 'rgba(12, 12, 58, 0.35)',
};

export const INITIAL_VISIBLE_BARS = 80;
const MAX_GAP_BARS = 1000;
const MIN_LABEL_GAP_PX = 90;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const periodMs: Record<Period, number> = {
	'1sec': 1000,
	'1min': MINUTE,
	'5min': 5 * MINUTE,
	'15min': 15 * MINUTE,
	'30min': 30 * MINUTE,
	'1h': HOUR,
	'4h': 4 * HOUR,
	'1d': DAY,
	'1w': 7 * DAY,
	'1m': 30 * DAY,
};

export const d = (v: number | string) => new Decimal(v);

export const isCalendarPeriod = (period: Period) =>
	period === '1d' || period === '1w' || period === '1m';

export function pricePrecision(price?: number) {
	if (!price || price <= 0) return 2;
	return Math.min(8, Math.max(2, 4 - Math.floor(Math.log10(price))));
}

export const fmtPrice = (n: number | string | undefined, precision: number) =>
	n === undefined || n === null || Number.isNaN(Number(n)) ? '-' : d(n).toFixed(precision);

export function diffFmt(curr: number | undefined, prev: number | undefined, precision: number) {
	if (curr === undefined || prev === undefined || Number(prev) === 0) {
		return { txt: '-', color: chartColors.neutral };
	}

	const diff = d(curr).minus(prev);
	const pct = diff.div(prev).mul(100);
	const sign = diff.greaterThan(0) ? '+' : '';

	const txt = `${sign}${diff.toFixed(precision)} (${sign}${pct.toFixed(2)}%)`;

	let color = chartColors.neutral;
	if (diff.greaterThan(0)) {
		color = chartColors.green;
	} else if (diff.lessThan(0)) {
		color = chartColors.red;
	}

	return { txt, color };
}

export function candleColor(candle?: ResultCandle) {
	if (!candle) return chartColors.default;
	const [, , , open, close] = candle;
	if (d(close).eq(open)) return chartColors.neutral;
	return close > open ? chartColors.green : chartColors.red;
}

export function buildCandles(src: CandleRow[]): ResultCandle[] {
	const arr = (TESTING_MODE ? (testCandles as CandleRow[]) : src).map(
		(c) =>
			[
				parseInt(c.timestamp, 10),
				c.shadow_top || 0,
				c.shadow_bottom || 0,
				c.body_first || 0,
				c.body_second || 0,
			] as ResultCandle,
	);

	return arr
		.filter((e) => e[0])
		.map((e) => {
			for (let i = 1; i < 5; i++) if (d(e[i]).lessThan(0.00001)) e[i] = 0;
			return e;
		});
}

export function nextTs(ts: number, period: Period) {
	if (period === '1m') {
		const date = new Date(ts);
		return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
	}
	return ts + periodMs[period];
}

function prevTs(ts: number, period: Period) {
	if (period === '1m') {
		const date = new Date(ts);
		return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1);
	}
	return ts - periodMs[period];
}

export function buildTimeline(candles: ResultCandle[], period: Period, now = Date.now()) {
	const timeline = candles.map((c) => c[0]);
	let last = timeline[timeline.length - 1];
	if (last === undefined) return timeline;
	for (let i = 0; i < MAX_GAP_BARS; i++) {
		const next = nextTs(last, period);
		if (next > now) break;
		timeline.push(next);
		last = next;
	}
	return timeline;
}

interface DateParts {
	year: number;
	month: number;
	day: number;
	hours: number;
	minutes: number;
}

function getParts(ts: number, utc: boolean): DateParts {
	const date = new Date(ts);
	return utc
		? {
				year: date.getUTCFullYear(),
				month: date.getUTCMonth(),
				day: date.getUTCDate(),
				hours: date.getUTCHours(),
				minutes: date.getUTCMinutes(),
			}
		: {
				year: date.getFullYear(),
				month: date.getMonth(),
				day: date.getDate(),
				hours: date.getHours(),
				minutes: date.getMinutes(),
			};
}

const pad = (n: number) => String(n).padStart(2, '0');

export function axisLabel(ts: number, period: Period) {
	const utc = isCalendarPeriod(period);
	const cur = getParts(ts, utc);
	const prev = getParts(prevTs(ts, period), utc);

	if (cur.year !== prev.year) return String(cur.year);
	if (cur.month !== prev.month) return MONTHS[cur.month];
	if (cur.day !== prev.day) return String(cur.day);
	return `${pad(cur.hours)}:${pad(cur.minutes)}`;
}

export function pointerLabel(ts: number, period: Period) {
	const utc = isCalendarPeriod(period);
	const p = getParts(ts, utc);
	const date = `${p.year}/${pad(p.month + 1)}/${pad(p.day)}`;
	if (period === '1m') return `${p.year}/${pad(p.month + 1)}`;
	if (utc) return date;
	return `${date} ${pad(p.hours)}:${pad(p.minutes)}`;
}

type TickUnit = 'minute' | 'day' | 'month' | 'year';

interface TickStep {
	unit: TickUnit;
	count: number;
	approx: number;
}

const TICK_STEPS: TickStep[] = [
	...[1, 5, 10, 15, 30, 60, 120, 180, 240, 360, 480, 720].map((count) => ({
		unit: 'minute' as const,
		count,
		approx: count * MINUTE,
	})),
	...[1, 2, 3, 5, 7, 10, 15].map((count) => ({
		unit: 'day' as const,
		count,
		approx: count * DAY,
	})),
	...[1, 3, 6].map((count) => ({ unit: 'month' as const, count, approx: count * 30 * DAY })),
	{ unit: 'year', count: 1, approx: 365 * DAY },
];

export function pickTickStep(period: Period, visibleBars: number, widthPx: number) {
	const pxPerBar = widthPx / Math.max(visibleBars, 1);
	const minSpan = Math.ceil(MIN_LABEL_GAP_PX / pxPerBar) * periodMs[period];
	const calendar = isCalendarPeriod(period);

	return (
		TICK_STEPS.find((step) => {
			if (step.approx < Math.max(minSpan, periodMs[period])) return false;
			if (step.unit === 'minute') {
				return !calendar && step.approx % periodMs[period] === 0;
			}
			return true;
		}) ?? TICK_STEPS[TICK_STEPS.length - 1]
	);
}

export const tickStepKey = (step: TickStep) => `${step.unit}${step.count}`;

function daysInMonth(year: number, month: number) {
	return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function bucketOf(ts: number, step: TickStep, utc: boolean) {
	const p = getParts(ts, utc);
	switch (step.unit) {
		case 'minute': {
			const offset = utc ? 0 : -new Date(ts).getTimezoneOffset() * MINUTE;
			return Math.floor((ts + offset) / step.approx);
		}
		case 'day':
			return (p.year * 12 + p.month) * 100 + Math.floor((p.day - 1) / step.count);
		case 'month':
			return Math.floor((p.year * 12 + p.month) / step.count);
		default:
			return p.year;
	}
}

export function buildTickIndices(timeline: number[], period: Period, step: TickStep) {
	const utc = isCalendarPeriod(period);
	const result: number[] = [];
	let prevBucket = timeline.length ? bucketOf(timeline[0], step, utc) : 0;

	for (let i = 1; i < timeline.length; i++) {
		const bucket = bucketOf(timeline[i], step, utc);
		if (bucket === prevBucket) continue;
		prevBucket = bucket;

		if (step.unit === 'day' && step.count > 1) {
			const p = getParts(timeline[i], utc);
			const bucketStartDay = Math.floor((p.day - 1) / step.count) * step.count + 1;
			const isMonthStart = bucketStartDay === 1;
			if (
				!isMonthStart &&
				bucketStartDay + step.count / 2 >= daysInMonth(p.year, p.month) + 1
			) {
				continue;
			}
		}

		result.push(i);
	}

	return result;
}
