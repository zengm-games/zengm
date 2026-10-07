import { defineChart, dot, lineY, text } from "@tanstack/charts";
import { decorative } from "@tanstack/charts/mark/decorative";
import { Chart } from "@tanstack/charts/react/tooltip";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { useMemo, useState, type ReactNode } from "react";
import { realtimeUpdate } from "../../util/realtimeUpdate.ts";

export type TooltipData<Row> = {
	x: number;
	y: number;
	row: Row;
};

type ScatterPlotProps<Row> = {
	data: TooltipData<Row>[];
	descShort: [string, string];
	descLong: [string | undefined, string | undefined];
	getImageUrl?: (row: Row) => string | undefined;
	getKey: (row: Row) => string | number;
	getLink: (row: Row) => string;
	getTooltipTitle: (row: Row) => string;
	renderTooltip: (value: number, row: Row, i: number) => ReactNode;
	reverseAxis: [boolean, boolean];
	stat: [string, string];
	statType: [string, string];
};

const linearRegression = (
	points: {
		x: number;
		y: number;
	}[],
) => {
	const numPoints = points.length;

	let rSquared = 1;

	if (numPoints === 0) {
		return {
			m: 0,
			b: 0,
			rSquared,
		};
	}

	let sum_x = 0;
	let sum_y = 0;
	let sum_xy = 0;
	let sum_xx = 0;

	for (const point of points) {
		const { x, y } = point;
		sum_x += x;
		sum_y += y;
		sum_xx += x * x;
		sum_xy += x * y;
	}

	const m =
		(numPoints * sum_xy - sum_x * sum_y) / (numPoints * sum_xx - sum_x * sum_x);
	const b = sum_y / numPoints - (m * sum_x) / numPoints;

	if (numPoints > 1) {
		const yAvg = sum_y / numPoints;

		let sumSquaresTotal = 0;
		for (const point of points) {
			sumSquaresTotal += Math.pow(point.y - yAvg, 2);
		}

		let sumSquaresResidual = 0;
		for (const point of points) {
			sumSquaresResidual += Math.pow(point.y - (m * point.x + b), 2);
		}

		if (sumSquaresResidual !== 0) {
			rSquared = 1 - sumSquaresResidual / sumSquaresTotal;
		}
	}

	return { m, b, rSquared };
};

const HEIGHT = 455;
const IMAGE_SIZE = 24;

const getDomain = (values: number[], reverse: boolean) => {
	const domain: [number, number] =
		values.length === 0 ? [0, 1] : [Math.min(...values), Math.max(...values)];

	// Positions at the start of each axis, which depends on if it is reversed
	const [start, end] = reverse ? [domain[1], domain[0]] : domain;

	return { domain, start, end };
};

export const StatGraph = <Row extends unknown>({
	data,
	descLong,
	descShort,
	getImageUrl,
	getKey,
	getLink,
	getTooltipTitle,
	renderTooltip,
	reverseAxis,
}: ScatterPlotProps<Row>) => {
	// https://stackoverflow.com/a/4819886 so we detect tablets too, rather than using window.mobile just based on screen size
	const touch = "ontouchstart" in window;

	const [reverseX, reverseY] = reverseAxis;
	const labelX = `${descShort[0]}${descLong[0] !== undefined ? ` (${descLong[0]})` : ""}`;
	const labelY = `${descShort[1]}${descLong[1] !== undefined ? ` (${descLong[1]})` : ""}`;

	const definition = useMemo(() => {
		const x = getDomain(
			data.map((point) => point.x),
			reverseX,
		);
		const y = getDomain(
			data.map((point) => point.y),
			reverseY,
		);

		const { m, b, rSquared } = linearRegression(data);
		const rSquaredRounded = Math.round(100 * rSquared) / 100;

		const withImage: TooltipData<Row>[] = [];
		const withoutImage: TooltipData<Row>[] = [];
		for (const point of data) {
			if (getImageUrl?.(point.row)) {
				withImage.push(point);
			} else {
				withoutImage.push(point);
			}
		}

		const fontSize = 13;

		return defineChart({
			marks: [
				decorative(
					lineY(
						x.domain.map((value) => ({ x: value, y: m * value + b })),
						{
							x: "x",
							y: "y",
							stroke: "var(--bs-red)",
							strokeOpacity: 0.7,
							strokeWidth: 4,
						},
					),
				),
				dot(withoutImage, {
					x: (d) => d.x,
					y: (d) => d.y,
					key: (d) => getKey(d.row),
					r: 6,
					fill: "var(--bs-blue)",
					fillOpacity: 0.8,
				}),

				// Invisible hover targets for the images, which are drawn on top of the chart
				dot(withImage, {
					x: (d) => d.x,
					y: (d) => d.y,
					key: (d) => getKey(d.row),
					r: IMAGE_SIZE / 2,
					fillOpacity: 0,
				}),
				decorative(
					text([{ x: x.start, y: y.end }], {
						x: "x",
						y: "y",
						text: () => `R² = ${rSquaredRounded}`,
						fill: "var(--bs-black)",
						anchor: "start",
						dx: 10,
						dy: 10,
					}),
				),
			],
			scales: {
				x: {
					scale: scaleLinear().domain(x.domain),
					reverse: reverseX,
					axis: {
						label: {
							text: labelX,
							fontSize,
						},
						tickLabels: {
							fontSize,
						},
					},
				},
				y: {
					scale: scaleLinear().domain(y.domain),
					reverse: reverseY,
					axis: {
						label: {
							text: labelY,
							fontSize,
						},
						tickLabels: {
							fontSize,
						},
					},
				},
			},
			tooltip: {
				use: tooltip,

				// On desktop, clicking a point is a link. On mobile, tapping a point shows the tooltip.
				sticky: touch,
			},
		});
	}, [data, getImageUrl, getKey, labelX, labelY, reverseX, reverseY, touch]);

	// Pixel coordinates of the points, for drawing images on top of the chart
	const [renderedPoints, setRenderedPoints] = useState<
		readonly { x: number; y: number; datum: TooltipData<Row> }[]
	>([]);

	// Clicking navigates to the highlighted point's link, so show that with the cursor
	const [pointHighlighted, setPointHighlighted] = useState(false);

	return (
		<div className="position-relative">
			<Chart
				definition={definition}
				height={HEIGHT}
				ariaLabel={`${labelY} vs ${labelX}`}
				style={{
					cursor: pointHighlighted && !touch ? "pointer" : undefined,
				}}
				onFocusChange={(point) => {
					setPointHighlighted(point !== null);
				}}
				onRender={({ scene }) => {
					setRenderedPoints(scene.points);
				}}
				onSelect={(point) => {
					if (point && !touch) {
						realtimeUpdate([], getLink(point.datum.row));
					}
				}}
				renderTooltipBody={({ points }) => {
					const point = points[0]?.datum;
					if (!point) {
						return null;
					}

					return (
						<>
							<h3>{getTooltipTitle(point.row)}</h3>
							{([0, 1] as const).map((i) => {
								return renderTooltip(point[i === 0 ? "x" : "y"], point.row, i);
							})}
						</>
					);
				}}
			/>
			{getImageUrl
				? renderedPoints.map((point) => {
						const imageUrl = getImageUrl(point.datum.row);
						if (!imageUrl) {
							return null;
						}

						return (
							<div
								key={getKey(point.datum.row)}
								className="position-absolute d-flex align-items-center justify-content-center pe-none"
								style={{
									left: point.x - IMAGE_SIZE / 2,
									top: point.y - IMAGE_SIZE / 2,
									width: IMAGE_SIZE,
									height: IMAGE_SIZE,
								}}
							>
								<img
									src={imageUrl}
									className="mw-100 mh-100"
									alt={getTooltipTitle(point.datum.row)}
								/>
							</div>
						);
					})
				: null}
		</div>
	);
};
