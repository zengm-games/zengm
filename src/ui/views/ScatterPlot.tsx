import { scaleLinear } from "@visx/scale";
import { Axis, AxisLeft } from "@visx/axis";
import { Circle, LinePath } from "@visx/shape";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { localPoint } from "@visx/event";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { Fragment, useCallback, useRef } from "react";

type ToolTipData = {
	x: number;
	y: number;
	label: string;
};

type ScatterPlotProps = {
	data: ToolTipData[];
	width: number;
	height: number;
	statX?: string;
	statY?: string;
};

const calculateBestFitLine = (
	xValues: number[],
	yValues: number[],
): [number, number] => {
	var sum_x = 0;
	var sum_y = 0;
	var sum_xy = 0;
	var sum_xx = 0;
	var count = 0;

	/*
	 * We'll use those variables for faster read/write access.
	 */
	var x = 0;
	var y = 0;
	var values_length = xValues.length;

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
	for (var v = 0; v < values_length; v++) {
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
	var m = (count * sum_xy - sum_x * sum_y) / (count * sum_xx - sum_x * sum_x);
	var b = sum_y / count - (m * sum_x) / count;
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
		Math.max(...props.data.map(x)),
	];

	const yDomain = [
		Math.min(...props.data.map(y)),
		Math.max(...props.data.map(y)),
	];

	// tooltip handler
	const {
		showTooltip,
		hideTooltip,
		tooltipData,
		tooltipOpen,
		tooltipTop = props.height,
		tooltipLeft = 0,
	} = useTooltip<ToolTipData>();

	let tooltipTimeout = 1500;

	const svgRef = useRef(null);

	const margin = { top: 30, left: 60, right: 40, bottom: 60 };
	const width = props.width - margin.left - margin.right;
	const innerWidth = props.width - margin.left - margin.right;
	const innerHeight = props.height - margin.top - margin.bottom;
	const xScale = scaleLinear({
		domain: xDomain,
		range: [margin.left, innerWidth + margin.left],
	});
	const yScale = scaleLinear({
		domain: yDomain,
		range: [innerHeight + margin.top, margin.top],
		nice: true,
	});

	const [m, b] = calculateBestFitLine(
		props.data.map(x => x.x),
		props.data.map(x => x.y),
	);
	const avg = (x: number) => {
		return m * x + b;
	};

	const handleMouseMove = useCallback(
		(event: any, data: any) => {
			if (tooltipTimeout) clearTimeout(tooltipTimeout);
			if (!svgRef.current) return;
			const closest = localPoint((event.target as any).ownerSVGElement, event);
			if (closest) {
				showTooltip({
					tooltipLeft: xScale(x(closest.x)),
					tooltipTop: yScale(y(closest.y)),
					tooltipData: data,
				});
			}
		},
		[xScale, yScale, showTooltip, tooltipTimeout],
	);
	const handleMouseLeave = useCallback(() => {
		tooltipTimeout = window.setTimeout(() => {
			hideTooltip();
		}, 1500);
	}, [hideTooltip]);

	return (
		<div>
			<svg width={width} height={HEIGHT} ref={svgRef}>
				<rect
					x={margin.left}
					y={margin.top}
					width={innerWidth}
					height={innerHeight}
					fill="transparent"
					onMouseLeave={handleMouseLeave}
					onTouchEnd={handleMouseLeave}
				/>
				<Group>
					<AxisLeft scale={yScale} left={margin.left} label={props.statY} />
					<Axis
						orientation="top"
						scale={xScale}
						top={margin.top}
						numTicks={5}
						tickStroke="transparent"
						stroke="transparent"
					/>
					<Axis
						orientation="bottom"
						scale={xScale}
						top={innerHeight + margin.top}
						numTicks={5}
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
					{props.data.map((d: any, i: number) => {
						return (
							<Fragment key={i}>
								<a href={d.link}>
									<Circle
										key={i}
										cx={xScale(x(d))}
										cy={yScale(y(d))}
										fillOpacity={0.8}
										onMouseMove={event => handleMouseMove(event, d)}
										onTouchMove={event => handleMouseMove(event, d)}
										r={3}
										fill={"#c93232"}
									/>
								</a>
							</Fragment>
						);
					})}
				</Group>
			</svg>
			{tooltipOpen &&
				tooltipData &&
				tooltipLeft != null &&
				tooltipTop != null && (
					<TooltipWithBounds left={tooltipLeft + margin.left} top={tooltipTop}>
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
				)}
		</div>
	);
};

export const StatGraph = (props: any) => {
	return (
		<div>
			<ParentSize>
				{parent => (
					<ScatterPlot
						data={props.data}
						width={parent.width}
						height={parent.height}
						statX={props.statX}
						statY={props.statY}
					/>
				)}
			</ParentSize>
		</div>
	);
};
