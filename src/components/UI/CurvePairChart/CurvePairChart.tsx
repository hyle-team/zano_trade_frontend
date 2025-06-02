import { useEffect, useRef } from 'react';
import { useWindowWidth } from '@react-hook/window-size';
import { canvasResize } from '@/utils/utils';
import CurvePairChartProps from '@/interfaces/props/components/UI/CurvePairChart/CurvePairChartProps';
import Point from '@/interfaces/common/Point';
import styles from './CurvePairChart.module.scss';

function CurvePairChart(props: CurvePairChartProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const width = useWindowWidth();

	const { data, isAscending } = props;

	function canvasDraw(canvas: HTMLCanvasElement, data: Point[] = []) {
		canvasResize(canvas);

		const ctx = canvas.getContext('2d');

		if (!ctx) return;

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		const rect = ctx.canvas.getBoundingClientRect();

		const canvasWidth = rect.width;
		const canvasHeight = rect.height;

		function drawChart(data: Point[]) {
			if (!ctx) return;

			const padding = 3;
			const drawingWidth = canvasWidth - padding * 2;
			const drawingHeight = canvasHeight - padding * 2;

			const maxValue = Math.max(...data.map((e) => e.y));
			const minValue = Math.min(...data.map((e) => e.y));

			const maxX = Math.max(...data.map((e) => e.x));
			const minX = Math.min(...data.map((e) => e.x));

			// const step = drawingWidth / (data.length - 1);

			const points = data
				.sort((a, b) => a.x - b.x)
				.map((e) => {
					const x = padding + ((e.x - minX) / (maxX - minX)) * drawingWidth;
					const y =
						canvasHeight -
						padding -
						((e.y - minValue) / (maxValue - minValue)) * drawingHeight;

					return { x, y };
				});

			if (points.length < 2) return;

			ctx.strokeStyle = isAscending ? 'rgba(22, 209, 214, 1)' : 'rgba(255, 103, 103, 1)';
			ctx.moveTo(points[0].x, points[0].y);

			ctx.lineWidth = 4;
			ctx.lineCap = 'round';

			let i;

			for (i = 0; i < points.length - 2; i++) {
				const xc = (points[i].x + points[i + 1].x) / 2;
				const yc = (points[i].y + points[i + 1].y) / 2;

				ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
			}

			ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
			ctx.stroke();
		}

		drawChart(data);
	}

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		canvasDraw(canvas, data);
	}, [data, width]);

	return (
		<div className={styles.curve__chart__wrapper}>
			{data?.length !== undefined && data.length < (props.minLength || 2) ? (
				<h5>[ Low volume ]</h5>
			) : (
				<canvas ref={canvasRef} className={props.className}></canvas>
			)}
		</div>
	);
}

export default CurvePairChart;
