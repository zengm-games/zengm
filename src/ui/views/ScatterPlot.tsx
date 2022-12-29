import { scaleLinear, scaleLog, scaleSqrt, scaleOrdinal } from "@visx/scale";
import { Axis, AxisLeft } from "@visx/axis";
import { Circle } from "@visx/shape";
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
};

export const ScatterPlot = (props: ScatterPlotProps) => {
	const HEIGHT = 400;

	const x = (d: any): number => {
		console.log(d.x);
		return d.x;
	};

	const y = (d: any): number => d.y;
	const scale = scaleLinear({ range: [0, 1000] });
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
		tooltipTop = 0,
		tooltipLeft = 0,
	} = useTooltip<ToolTipData>();

	let tooltipTimeout = 1500;

	const svgRef = useRef(null);

	const margin = { top: 30, left: 60, right: 40, bottom: 40 };

	return (
		<div>
			<ParentSize>
				{parent => {
					const width = parent.width - margin.left - margin.right;
					const innerWidth = parent.width - margin.left - margin.right;
					const innerHeight = parent.height - margin.top - margin.bottom;
					const xScale = scaleLinear({
						domain: xDomain,
						range: [margin.left, innerWidth + margin.left],
					});
					const yScale = scaleLinear({
						domain: yDomain,
						range: [innerHeight + margin.top, margin.top],
						nice: true,
					});
					const handleMouseMove = useCallback(
						(event: any, data: any) => {
							if (tooltipTimeout) clearTimeout(tooltipTimeout);
							if (!svgRef.current) return;
							const point = localPoint(svgRef.current, event);
							if (!point) return;
							const neighborRadius = 100;
							const closest = localPoint(
								(event.target as any).ownerSVGElement,
								event,
							);
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
								<AxisLeft
									scale={yScale}
									left={margin.left}
									label="Life expectancy"
								/>
								<Axis
									orientation="top"
									scale={xScale}
									top={margin.top}
									numTicks={2}
									tickStroke="transparent"
									stroke="transparent"
								/>
								<Axis
									orientation="bottom"
									scale={xScale}
									top={innerHeight + margin.top}
									numTicks={2}
									label="GDP per cap"
								/>
								{props.data.map((d: any, i: number) => {
									return (
										<Fragment key={i}>
											<Circle
												key={i}
												cx={xScale(x(d))}
												cy={yScale(y(d))}
												fillOpacity={0.8}
												onMouseMove={event => handleMouseMove(event, d)}
												onTouchMove={event => handleMouseMove(event, d)}
												r={3}
												fill={"#ff8906"}
											/>
										</Fragment>
									);
								})}
							</Group>
						</svg>
					);
				}}
			</ParentSize>
			{tooltipOpen &&
				tooltipData &&
				tooltipLeft != null &&
				tooltipTop != null && (
					<TooltipWithBounds left={tooltipLeft + 10} top={tooltipTop + 10}>
						<h3>{tooltipData.label}</h3>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gridTemplateRows: "1fr",
							}}
						>
							<div>stats x</div>
							<div style={{ textAlign: "right" }}>x(tooltipData)</div>
							<div>stats y</div>
							<div style={{ textAlign: "right" }}>
								{Math.round(y(tooltipData))}
							</div>
						</div>
					</TooltipWithBounds>
				)}
		</div>
	);
};
