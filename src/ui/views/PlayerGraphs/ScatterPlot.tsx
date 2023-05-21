import { scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Circle, LinePath } from "@visx/shape";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { localPoint } from "@visx/event";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { useRef, type MouseEvent } from "react";
import { helpers } from "../../util";

export type TooltipData = {
	x: number;
	y: number;
	pid: number;
	name: string;
};

type ScatterPlotProps = {
	data: TooltipData[];
	descShort: [string, string];
	descLong: [string, string];
	stat: [string, string];
	statType: [string, string];
};

const calculateBestFitLine = (
	points: {
		x: number;
		y: number;
	}[],
): [number, number] => {
	const numPoints = points.length;

	if (numPoints === 0) {
		return [0, 0];
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

	return [m, b];
};
const ScatterPlot = (
	props: ScatterPlotProps & {
		width: number;
	},
) => {
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

	const margin = { top: 10, left: 60, right: 10, bottom: 60 };
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

	const [m, b] = calculateBestFitLine(props.data);
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

	const axisLabelProps = {
		fontSize: "1em",
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
						label={`${props.descShort[1]} (${props.descLong[1]})`}
						labelProps={axisLabelProps}
						tickLabelProps={axisLabelProps}
					/>
					<AxisBottom
						axisClassName="chart-axis"
						scale={xScale}
						top={HEIGHT}
						label={`${props.descShort[0]} (${props.descLong[0]})`}
						labelProps={{
							...axisLabelProps,
							dy: "1.5em",
						}}
						tickLabelProps={axisLabelProps}
					/>
					<LinePath
						y={d => yScale(avg(d))}
						x={d => xScale(d)}
						stroke={"var(--bs-red)"}
						data={xDomain}
						opacity={0.7}
						strokeWidth={4}
					/>
					{props.data.map((d, i) => {
						return (
							<a key={i} href={helpers.leagueUrl(["player", d.pid])}>
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
						);
					})}
				</Group>
			</svg>
			{tooltipOpen && tooltipData ? (
				<TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
					<h3>{tooltipData.name}</h3>
					{([0, 1] as const).map(i => {
						return (
							<div key={i}>
								{helpers.roundStat(
									tooltipData[i === 0 ? "x" : "y"],
									props.stat[i],
									props.statType[i] === "totals",
								)}{" "}
								{props.descShort[i]}
							</div>
						);
					})}
				</TooltipWithBounds>
			) : null}
		</div>
	);
};

export const StatGraph = (props: ScatterPlotProps) => {
	return (
		<div className="position-relative">
			<ParentSize>
				{parent => <ScatterPlot width={parent.width} {...props} />}
			</ParentSize>
		</div>
	);
};
