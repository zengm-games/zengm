import { scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Circle, LinePath } from "@visx/shape";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { localPoint } from "@visx/event";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { Fragment, useRef, type MouseEvent } from "react";

type TooltipData = {
	x: number;
	y: number;
	label: string;
};

type ScatterPlotProps = {
	data: TooltipData[];
	width: number;
	statX?: string;
	statY?: string;
};

const calculateBestFitLine = (
	xValues: number[],
	yValues: number[],
): [number, number] => {
	let sum_x = 0;
	let sum_y = 0;
	let sum_xy = 0;
	let sum_xx = 0;
	let count = 0;

	/*
	 * We'll use those variables for faster read/write access.
	 */
	let x = 0;
	let y = 0;
	const values_length = xValues.length;

	if (values_length != yValues.length) {
		throw new Error(
			"The parameters values_x and values_y need to have same size!",
		);
	}

	/*
	 * Nothing to do.
	 */
	if (values_length === 0) {
		return [0, 0];
	}

	/*
	 * Calculate the sum for each of the parts necessary.
	 */
	for (let v = 0; v < values_length; v++) {
		x = xValues[v];
		y = yValues[v];
		sum_x += x;
		sum_y += y;
		sum_xx += x * x;
		sum_xy += x * y;
		count++;
	}

	/*
	 * Calculate m and b for the formular:
	 * y = x * m + b
	 */
	const m = (count * sum_xy - sum_x * sum_y) / (count * sum_xx - sum_x * sum_x);
	const b = sum_y / count - (m * sum_x) / count;
	return [m, b];
};
const ScatterPlot = (props: ScatterPlotProps) => {
	const HEIGHT = 400;

	const x = (d: any): number => {
		return d.x;
	};

	const y = (d: any): number => d.y;
	const xDomain = [
		Math.min(...props.data.map(x)),
		Math.max(...props.data.map(x)) * 1.05,
	];

	const yDomain = [
		Math.min(...props.data.map(y)),
		Math.max(...props.data.map(y)) * 1.05,
	];

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

	const margin = { top: 10, left: 60, right: 40, bottom: 60 };
	const width = props.width - margin.left - margin.right;
	const xScale = scaleLinear({
		domain: xDomain,
		range: [0, width],
		nice: true,
	});
	const yScale = scaleLinear({
		domain: yDomain,
		range: [HEIGHT, 0],
		nice: true,
	});

	const [m, b] = calculateBestFitLine(
		props.data.map(x => x.x),
		props.data.map(x => x.y),
	);
	const avg = (x: number) => {
		return m * x + b;
	};

	const handleMouseOver = (event: MouseEvent, data: TooltipData) => {
		const coords = localPoint((event.target as any).ownerSVGElement, event);
		if (coords) {
			showTooltip({
				tooltipLeft: coords.x,
				tooltipTop: coords.y,
				tooltipData: data,
			});
		}
	};

	return (
		<div>
			<svg
				width={props.width}
				height={HEIGHT + margin.top + margin.bottom}
				ref={svgRef}
			>
				<Group transform={`translate(${margin.left},${margin.top})`}>
					<AxisLeft
						axisClassName="chart-axis"
						scale={yScale}
						label={props.statY}
					/>
					<AxisBottom
						axisClassName="chart-axis"
						scale={xScale}
						top={HEIGHT}
						label={props.statX}
					/>
					<LinePath
						y={d => yScale(avg(d))}
						x={d => xScale(d)}
						stroke={"#3b55d4"}
						data={xDomain}
						opacity={0.7}
						strokeWidth={2}
					/>
					{props.data.map((d, i) => {
						return (
							<Fragment key={i}>
								<a href={d.link}>
									<Circle
										key={i}
										cx={xScale(x(d))}
										cy={yScale(y(d))}
										fillOpacity={0.8}
										onMouseOver={event => handleMouseOver(event, d)}
										onMouseOut={hideTooltip}
										r={5}
										fill={"var(--bs-blue)"}
									/>
								</a>
							</Fragment>
						);
					})}
				</Group>
			</svg>
			{tooltipOpen && tooltipData ? (
				<TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
					<h3>{tooltipData.label}</h3>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gridTemplateRows: "1fr",
						}}
					>
						<div>{props.statX ?? "X"}</div>
						<div style={{ textAlign: "right" }}>{x(tooltipData)}</div>
						<div>{props.statY ?? "X"}</div>
						<div style={{ textAlign: "right" }}>{y(tooltipData)}</div>
					</div>
				</TooltipWithBounds>
			) : null}
		</div>
	);
};

export const StatGraph = (props: any) => {
	return (
		<div className="position-relative">
			<ParentSize>
				{parent => (
					<ScatterPlot
						data={props.data}
						width={parent.width}
						statX={props.statX}
						statY={props.statY}
					/>
				)}
			</ParentSize>
		</div>
	);
};
