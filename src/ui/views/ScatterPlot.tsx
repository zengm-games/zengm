import { scaleLinear, scaleLog, scaleSqrt, scaleOrdinal } from "@visx/scale";
import { Axis, AxisLeft } from "@visx/axis";
import { Circle } from "@visx/shape";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { localPoint } from "@visx/event";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { Fragment, useCallback } from "react";

type ScatterPlotProps = {
	data: any[];
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
					return (
						<svg width={width} height={HEIGHT}>
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
		</div>
	);
};
