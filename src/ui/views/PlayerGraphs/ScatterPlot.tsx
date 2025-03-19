import { scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Circle, LinePath } from "@visx/shape";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { useRef, type ReactNode } from "react";

export type TooltipData = {
	x: number;
	y: number;
	row: any;
};

type ScatterPlotProps<Row> = {
	data: TooltipData[];
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

const ScatterPlot = <Row extends unknown>({
	data,
	descLong,
	descShort,
	getImageUrl,
	getKey,
	getLink,
	getTooltipTitle,
	renderTooltip,
	reverseAxis,
	width: totalWidth,
}: ScatterPlotProps<Row> & {
	width: number;
}) => {
	const HEIGHT = 400;

	const xVals = data.map((point) => point.x);
	const yVals = data.map((point) => point.y);

	const xDomain = [Math.min(...xVals), Math.max(...xVals)];
	if (reverseAxis[0]) {
		xDomain.reverse();
	}

	const yDomain = [Math.min(...yVals), Math.max(...yVals)];
	if (reverseAxis[1]) {
		yDomain.reverse();
	}

	// tooltip handler
	const {
		showTooltip,
		hideTooltip,
		tooltipData,
		tooltipOpen,
		tooltipTop,
		tooltipLeft,
	} = useTooltip<TooltipData>();

	const svgRef = useRef(null);

	const margin = { top: 10, left: 60, right: 10, bottom: 60 };
	const width = totalWidth - margin.left - margin.right;
	const xScale = scaleLinear({
		domain: xDomain,
		range: [0, width],
	});
	const yScale = scaleLinear({
		domain: yDomain,
		range: [HEIGHT, 0],
	});

	const { m, b, rSquared } = linearRegression(data);

	const avg = (x: number) => {
		return m * x + b;
	};

	const handleMouseOver = (x: number, y: number, data: TooltipData) => {
		showTooltip({
			tooltipLeft: x + margin.left,
			tooltipTop: y + margin.top,
			tooltipData: data,
		});
	};

	const fontSizeProps = {
		fontSize: "1em",
	};

	const labels = ([0, 1] as const).map(
		(i) =>
			`${descShort[i]}${descLong[i] !== undefined ? ` (${descLong[i]})` : ""}`,
	);

	const rSquaredRounded = Math.round(100 * rSquared) / 100;

	return (
		<div>
			<svg
				width={totalWidth}
				height={HEIGHT + margin.top + margin.bottom}
				ref={svgRef}
			>
				<Group transform={`translate(${margin.left},${margin.top})`}>
					<AxisLeft
						axisClassName="chart-axis"
						scale={yScale}
						label={labels[1]}
						labelProps={{
							...fontSizeProps,

							// Weird that this is required to center label
							textAnchor: "middle",
						}}
						tickLabelProps={fontSizeProps}
					/>
					<AxisBottom
						axisClassName="chart-axis"
						scale={xScale}
						top={HEIGHT}
						label={labels[0]}
						labelProps={{
							...fontSizeProps,
							dy: "1.5em",

							// Weird that this is required to center label
							textAnchor: "middle",
						}}
						tickLabelProps={fontSizeProps}
					/>
					<LinePath
						y={(d) => yScale(avg(d))}
						x={(d) => xScale(d)}
						stroke={"var(--bs-red)"}
						data={xDomain}
						opacity={0.7}
						strokeWidth={4}
					/>
					{data.map((d, i) => {
						const imageUrl = getImageUrl?.(d.row);

						const cx = xScale(d.x);
						const cy = yScale(d.y);

						const hoverParams = {
							onMouseOver: () => handleMouseOver(cx, cy, d),
							onMouseOut: hideTooltip,
						};

						let point;
						if (imageUrl) {
							const size = 24;

							// foreignObject is needed because an SVG <image> tag dosen't seem to support maintaining the aspect ratio of a .svg image, it only works with raster images
							point = (
								<foreignObject
									key={getKey(d.row)}
									x={cx - size / 2}
									y={cy - size / 2}
									width={size}
									height={size}
								>
									<div className="d-flex align-items-center justify-content-center w-100 h-100">
										<img
											src={imageUrl}
											className="mw-100 mh-100"
											alt={getTooltipTitle(d.row)}
											{...hoverParams}
										/>
									</div>
								</foreignObject>
							);
						} else {
							point = (
								<Circle
									key={getKey(d.row)}
									cx={cx}
									cy={cy}
									fillOpacity={0.8}
									r={6}
									fill={"var(--bs-blue)"}
									{...hoverParams}
								/>
							);
						}

						// https://stackoverflow.com/a/4819886 so we detect tablets too, rather than using window.mobile just based on screen size
						return "ontouchstart" in window ? (
							point
						) : (
							<a key={i} href={getLink(d.row)}>
								{point}
							</a>
						);
					})}
					<text
						x="10"
						y="10"
						style={{
							fill: "var(--bs-black)",
						}}
					>
						R
						<tspan
							baselineShift="super"
							style={{
								fontSize: 10,
							}}
						>
							2
						</tspan>{" "}
						= {rSquaredRounded}
					</text>
				</Group>
			</svg>
			{tooltipOpen && tooltipData ? (
				<TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
					<h3>{getTooltipTitle(tooltipData.row)}</h3>
					{([0, 1] as const).map((i) => {
						return renderTooltip(
							tooltipData[i === 0 ? "x" : "y"],
							tooltipData.row,
							i,
						);
					})}
				</TooltipWithBounds>
			) : null}
		</div>
	);
};

export const StatGraph = <Row extends unknown>(
	props: ScatterPlotProps<Row>,
) => {
	return (
		<div className="position-relative">
			<ParentSize>
				{(parent) => <ScatterPlot<Row> width={parent.width} {...props} />}
			</ParentSize>
		</div>
	);
};
