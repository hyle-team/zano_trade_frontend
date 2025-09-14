import CandleRow from '@/interfaces/common/CandleRow';
import CandleChartProps from '@/interfaces/props/pages/dex/trading/CandleChartProps/CandleChartProps';
import Decimal from 'decimal.js';
import * as echarts from 'echarts';
import { ResultCandle } from './types';
import testCandles from './testCandles.json';

export const TESTING_MODE = false;

export const chartColors = {
	green: '#16D1D6',
	red: '#FF6767',
	default: '#3D3D6C',
	light: '#e3e3e8',
	dark: '#1f1f4a',
	textColor: '#ffffff',
};

export const d = (v: number | string) => new Decimal(v);
export const fmt = (n?: number | string) =>
	n === undefined || n === null || Number.isNaN(Number(n))
		? '-'
		: d(n).toDecimalPlaces(6).toString();

export function diffFmt(curr?: number | string, prev?: number | string) {
	if (curr === undefined || prev === undefined || Number(prev) === 0) {
		return { txt: '-', color: '#9CA3AF' };
	}

	const diff = d(curr).minus(prev);
	const pct = diff.div(prev).mul(100);

	let sign = '';
	if (diff.greaterThan(0)) {
		sign = '+';
	} else if (diff.isZero()) {
		sign = '';
	}

	const txt = `${sign}${diff.toDecimalPlaces(8).toString()} (${sign}${pct.toDecimalPlaces(2).toString()}%)`;

	let color = '#9CA3AF';
	if (diff.greaterThan(0)) {
		color = chartColors.green;
	} else if (diff.lessThan(0)) {
		color = chartColors.red;
	}

	return { txt, color };
}

const isTodayTs = (ms: number) => new Date(ms).toDateString() === new Date().toDateString();

export const tsLabel = (ms: number) =>
	echarts.format.formatTime(isTodayTs(ms) ? 'hh:mm:ss' : 'hh:mm:ss\ndd-MM-yyyy', ms);

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

export function zoomStartByPeriod(period: CandleChartProps['period']) {
	const now = Date.now();
	const hr = 3600_000;
	switch (period) {
		// case '1sec':
		// 	return now - 1_000;
		case '1min':
			return now - hr / 60;
		case '5min':
			return now - 5 * (hr / 60);
		case '15min':
			return now - 15 * (hr / 60);
		case '30min':
			return now - 30 * (hr / 60);
		case '1h':
			return now - hr * 24;
		case '4h':
			return now - hr * 4;
		case '1d':
			return now - hr * 24 * 7;
		case '1w':
			return now - hr * 24 * 7 * 4;
		case '1m':
			return now - hr * 24 * 7 * 52;
		default:
			return now - hr;
	}
}

export function pickWindowIndices(timestamps: number[], startTs: number) {
	if (!timestamps.length) return { startIdx: 0, endIdx: 0 };
	const nearest = timestamps.reduce(
		(a, b) => (Math.abs(b - startTs) < Math.abs(a - startTs) ? b : a),
		timestamps[0],
	);
	return {
		startIdx: timestamps.indexOf(nearest),
		endIdx: timestamps.length - 1,
	};
}
