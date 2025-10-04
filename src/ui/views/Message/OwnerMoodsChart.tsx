import { AxisBottom } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { LinePath } from "@visx/shape";
import { scaleLinear, scalePoint } from "@visx/scale";
import { Text } from "@visx/text";
import { HelpPopover } from "../../components/index.tsx";
import type { View } from "../../../common/types.ts";
import { Fragment, type MouseEvent } from "react";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { helpers } from "../../util/index.ts";
import { localPoint } from "@visx/event";

export const ReferenceLine = ({
	x,
	y,
	color,
	text,
	textPosition,
}: {
	x: [number, number];
	y: [number, number];
	color: string;
	text?: string;
	textPosition?: "above" | "below" | "right";
}) => {
	let textX = x[1];
	let textY = y[1];

	if (textPosition === "below") {
		textX -= 4;
		textY += 17;
	} else if (textPosition === "above") {
		textX -= 4;
		textY -= 7;
	} else if (textPosition === "right") {
		textX += 5;
		textY += 14;
	}

	return (
		<>
			<LinePath
				className="chart-line"
				data={x}
				x={(d) => d}
				y={(d, i) => y[i]!}
				stroke={color}
				strokeDasharray="5 5"
			/>
			{text ? (
				<Text
					x={textX}
					y={textY}
					fill={color}
					textAnchor={
						textPosition === "below" || textPosition === "above"
							? "end"
							: undefined
					}
				>
					{text}
				</Text>
			) : null}
		</>
	);
};

const OwnerMoodsChart = ({
	ownerMoods,
}: {
	ownerMoods: NonNullable<
		NonNullable<View<"message">["message"]>["ownerMoods"]
	>;
}) => {
	const MAX_WIDTH = 400;
	const HEIGHT = 400;
	const STAR_SIZE = 40;

	const data = ownerMoods.map((mood) => {
		return {
			...mood,
			season: String(mood.season),
		};
	});
	const allValues: number[] = [];
	const seasons: string[] = [];

	for (const row of data) {
		allValues.push(row.money, row.playoffs, row.total, row.wins);
		seasons.push(row.season);
	}

	// totals span -1 to 3, others -3 to 1
	const yDomain = [Math.min(-1.3, ...allValues), Math.max(3.3, ...allValues)];

	const margin = {
		top: 0,
		right: 15,
		bottom: 30,
		left: 15,
	};

	const lineInfos: {
		key: "wins" | "playoffs" | "money" | "total";
		color: string;
		width?: number;
	}[] = [
		{
			key: "wins",
			color: "var(--bs-danger)",
		},
		{
			key: "playoffs",
			color: "var(--bs-info)",
		},
		{
			key: "money",
			color: "var(--bs-success)",
		},
		{
			key: "total",
			color: "var(--bs-dark)",
			width: 4,
		},
	];

	const yScale = scaleLinear({
		domain: yDomain,
		range: [HEIGHT, 0],
	});

	type TooltipData = (typeof data)[number];

	const {
		tooltipData,
		tooltipLeft,
		tooltipTop,
		tooltipOpen,
		showTooltip,
		hideTooltip,
	} = useTooltip<TooltipData>();

	const handleMouseOver = (event: MouseEvent, datum: TooltipData) => {
		const coords = localPoint((event.target as any).ownerSVGElement, event);
		if (coords) {
			showTooltip({
				tooltipLeft: coords.x,
				tooltipTop: coords.y,
				tooltipData: datum,
			});
		}
	};

	return (
		<div className="position-relative mt-n1">
			<HelpPopover
				title="Owner Mood History"
				style={{
					position: "absolute",
					left: 15,
					top: 5,
				}}
			>
				<p>
					This plot shows what the owner thinks of you and how that's changed
					over time.
				</p>
				<p>
					If your <b>Total</b> line drops below the{" "}
					<span className="text-danger">You're fired!</span> cutoff, then you're
					fired!
				</p>
				<p>
					The other lines (regular season, playoffs, finances) cannot
					individually get you fired. You only get fired based on the
					combination, which is the <b>Total</b> line.
				</p>
				<p>The owner only starts judging you two years after you're hired.</p>
			</HelpPopover>
			<ParentSize
				parentSizeStyles={{
					maxWidth: MAX_WIDTH,
				}}
			>
				{(parent) => {
					const width = parent.width - margin.left - margin.right;
					const xScale = scalePoint({
						domain: seasons,
						range: [0, width],
					});
					return (
						<svg
							width={width + margin.left + margin.right}
							height={HEIGHT + margin.top + margin.bottom}
						>
							<Group transform={`translate(${margin.left},${margin.top})`}>
								<ReferenceLine
									x={xScale.range()}
									y={[yScale(3), yScale(3)]}
									color="var(--bs-success)"
									text="Perfect"
									textPosition="above"
								/>
								<ReferenceLine
									x={xScale.range()}
									y={[yScale(-1), yScale(-1)]}
									color="var(--bs-danger)"
									text="You're fired!"
									textPosition="below"
								/>
								<ReferenceLine
									x={xScale.range()}
									y={[yScale(0), yScale(0)]}
									color="var(--bs-secondary)"
								/>
								{lineInfos.map(({ key, color, width = 1 }) => {
									const onMouseOver = (d: (typeof data)[number]) =>
										key === "total"
											? (event: MouseEvent) => {
													handleMouseOver(event, d);
												}
											: undefined;
									const onMouseOut = key === "total" ? hideTooltip : undefined;

									return (
										<Fragment key={key}>
											<LinePath
												className="chart-line"
												curve={curveMonotoneX}
												data={data}
												x={(d) => xScale(d.season) ?? 0}
												y={(d) => yScale(d[key]) ?? 0}
												stroke={color}
												strokeWidth={width}
											/>
											{data.map((d, j) => {
												return d.seasonInfo?.champ && key === "total" ? (
													<text
														key={j}
														className="user-select-none fill-yellow"
														x={xScale(d.season)}
														y={yScale(d[key])}
														fontSize={STAR_SIZE}
														textAnchor="middle"
														alignmentBaseline="middle"
														onMouseOver={onMouseOver(d)}
														onMouseOut={onMouseOut}
													>
														★
													</text>
												) : (
													<circle
														key={j}
														className="fill-white"
														r={3 * Math.sqrt(width)}
														cx={xScale(d.season)}
														cy={yScale(d[key])}
														stroke={color}
														strokeWidth={width}
														onMouseOver={onMouseOver(d)}
														onMouseOut={onMouseOut}
													/>
												);
											})}
										</Fragment>
									);
								})}
								<AxisBottom
									axisClassName="chart-axis"
									scale={xScale}
									tickLength={5}
									top={HEIGHT}
								/>
							</Group>
						</svg>
					);
				}}
			</ParentSize>
			{tooltipOpen && tooltipData ? (
				<TooltipWithBounds
					key={tooltipData.season}
					top={tooltipTop}
					left={tooltipLeft}
				>
					<b>{tooltipData.season}</b>
					{tooltipData.seasonInfo ? (
						<>
							<br />
							{helpers.formatRecord(tooltipData.seasonInfo)},{" "}
							{tooltipData.seasonInfo.roundsWonText}
							<br />
							Profit:{" "}
							{helpers.formatCurrency(tooltipData.seasonInfo.profit, "M")}
						</>
					) : null}
				</TooltipWithBounds>
			) : null}

			<div className="chart-legend">
				<ul className="list-unstyled mb-0">
					<li className="text-danger">— Regular season success</li>
					<li className="text-info">— Playoff success</li>
					<li className="text-success">— Finances</li>
					<li className="text-dark fw-bold">— Total</li>
				</ul>
			</div>
		</div>
	);
};

export default OwnerMoodsChart;
