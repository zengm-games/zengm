import PropTypes from "prop-types";
import { AxisBottom } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { LinePath } from "@visx/shape";
import { scaleLinear, scalePoint } from "@visx/scale";
import { Text } from "@visx/text";
import { HelpPopover } from "../../components";
import type { OwnerMood } from "../../../common/types";
import { Fragment } from "react";

export const ReferenceLine = ({
	x,
	y,
	color,
	text,
	textBelow,
}: {
	x: [number, number];
	y: number;
	color: string;
	text?: string;
	textBelow?: boolean;
}) => {
	return (
		<>
			<LinePath
				className="chart-line"
				data={x}
				x={d => d}
				y={y}
				stroke={color}
				strokeDasharray="5 5"
			/>
			{text ? (
				<Text
					x={x[1] - 4}
					y={y + (textBelow ? 17 : -7)}
					fill={color}
					textAnchor="end"
				>
					{text}
				</Text>
			) : null}
		</>
	);
};

const OwnerMoodsChart = ({
	ownerMoods,
	year,
}: {
	ownerMoods: OwnerMood[];
	year: number;
}) => {
	const MAX_WIDTH = 400;
	const HEIGHT = 400;

	const data = ownerMoods.map((mood, i) => {
		return {
			...mood,
			total: mood.money + mood.playoffs + mood.wins,
			year: String(year - ownerMoods.length + 1 + i),
		};
	});
	const allValues: number[] = [];
	const years: string[] = [];

	for (const row of data) {
		allValues.push(row.money, row.playoffs, row.total, row.wins);
		years.push(row.year);
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
			color: "var(--danger)",
		},
		{
			key: "playoffs",
			color: "var(--info)",
		},
		{
			key: "money",
			color: "var(--success)",
		},
		{
			key: "total",
			color: "var(--dark)",
			width: 4,
		},
	];

	const yScale = scaleLinear({
		domain: yDomain,
		range: [HEIGHT, 0],
	});

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
				{parent => {
					const width = parent.width - margin.left - margin.right;
					const xScale = scalePoint({
						domain: years,
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
									y={yScale(3)}
									color="var(--success)"
									text="Perfect"
								/>
								<ReferenceLine
									x={xScale.range()}
									y={yScale(-1)}
									color="var(--danger)"
									text="You're fired!"
									textBelow
								/>
								<ReferenceLine
									x={xScale.range()}
									y={yScale(0)}
									color="var(--secondary)"
								/>
								{lineInfos.map(({ key, color, width = 1 }) => {
									return (
										<Fragment key={`line-${key}`}>
											<LinePath
												curve={curveMonotoneX}
												data={data}
												x={d => xScale(d.year) ?? 0}
												y={d => yScale(d[key]) ?? 0}
												stroke={color}
												strokeWidth={width}
											/>
											{data.map((d, j) => (
												<circle
													key={j}
													className="chart-point"
													r={3 * Math.sqrt(width)}
													cx={xScale(d.year)}
													cy={yScale(d[key])}
													stroke={color}
													strokeWidth={width}
												/>
											))}
										</Fragment>
									);
								})}
								<AxisBottom
									axisClassName="chart-axis"
									scale={xScale}
									top={HEIGHT}
								/>
							</Group>
						</svg>
					);
				}}
			</ParentSize>

			<div className="chart-legend">
				<ul className="list-unstyled mb-0">
					<li className="text-danger">— Regular season success</li>
					<li className="text-info">— Playoff success</li>
					<li className="text-success">— Finances</li>
					<li className="text-dark font-weight-bold">— Total</li>
				</ul>
			</div>
		</div>
	);
};

OwnerMoodsChart.propTypes = {
	ownerMoods: PropTypes.arrayOf(
		PropTypes.shape({
			money: PropTypes.number.isRequired,
			playoffs: PropTypes.number.isRequired,
			wins: PropTypes.number.isRequired,
		}),
	).isRequired,
	year: PropTypes.number.isRequired,
};

export default OwnerMoodsChart;
