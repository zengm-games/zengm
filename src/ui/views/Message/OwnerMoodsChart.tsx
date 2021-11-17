import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { axisBottom } from "d3-axis";
import {
	scaleLinear as scaleLinearD3,
	scalePoint as scalePointD3,
} from "d3-scale";
import { curveMonotoneX as curveMonotoneXD3, line } from "d3-shape";
import { select } from "d3-selection";
import { AxisBottom } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { Group } from "@visx/group";
import { LinePath } from "@visx/shape";
import { scaleLinear, scalePoint } from "@visx/scale";
import { Text } from "@visx/text";
import { HelpPopover } from "../../components";
import type { OwnerMood } from "../../../common/types";

const ReferenceLine = ({
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
	const width = MAX_WIDTH - 30;

	const margin = {
		top: 0,
		right: 15,
		bottom: 30,
		left: 15,
	};

	const [node, setNode] = useState<HTMLDivElement | null>(null);
	const getNode = useCallback(node2 => {
		if (node2 !== null) {
			setNode(node2);
		}
	}, []);
	useEffect(() => {
		if (node) {
			const width = node.clientWidth - margin.left - margin.right;
			const xScaleD3 = scalePointD3().domain(years).range([0, width]);
			const yScaleD3 = scaleLinearD3().domain(yDomain).range([HEIGHT, 0]) as (
				y: number,
			) => number;
			const svg = select(node)
				.append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", HEIGHT + margin.top + margin.bottom)
				.append("g")
				.attr("transform", `translate(${margin.left},${margin.top})`);

			const drawReferenceLine = (
				y: number,
				color: string,
				text?: string,
				position?: string,
			) => {
				const line2 = line<number>()
					.x(d => d)
					.y(() => yScaleD3(y));
				svg
					.append("path")
					.datum(xScaleD3.range())
					.attr("class", "chart-line")
					.style("stroke", color)
					.style("stroke-dasharray", "5 5")
					.attr("d", line2);

				if (text) {
					svg
						.append("text")
						.attr("y", yScaleD3(y) + (position === "above" ? -7 : 17))
						.attr("x", width - 4)
						.attr("text-anchor", "end")
						.style("fill", color)
						.text(text);
				}
			};

			drawReferenceLine(3, "var(--success)", "Perfect", "above");
			drawReferenceLine(-1, "var(--danger)", "You're fired!", "below");
			drawReferenceLine(0, "var(--secondary)");

			type Data = typeof data[number];
			const drawLine = (
				attr: Exclude<keyof Data, "year">,
				color: string,
				strokeWidth = 1,
			) => {
				const line2 = line<Data>()
					.x(d => xScaleD3(d.year) as number)
					.y(d => yScaleD3(d[attr]))
					.curve(curveMonotoneXD3);

				svg
					.append("path")
					.datum(data)
					.attr("class", "chart-line")
					.style("stroke", color)
					.style("stroke-width", strokeWidth)
					.attr("d", line2);

				svg
					.selectAll()
					.data(data)
					.enter()
					.append("circle")
					.attr("class", "chart-point")
					.attr("stroke", color)
					.style("stroke-width", strokeWidth)
					.attr("cx", d => xScaleD3(d.year) as number)
					.attr("cy", d => yScaleD3(d[attr]))
					.attr("r", 3 * Math.sqrt(strokeWidth));
			};

			drawLine("wins", "var(--danger)");
			drawLine("playoffs", "var(--info)");
			drawLine("money", "var(--success)");
			drawLine("total", "var(--dark)", 4);
			svg
				.append("g")
				.attr("class", "chart-axis")
				.attr("transform", `translate(0,${HEIGHT})`)
				.call(axisBottom(xScaleD3));
		}
	});

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

	const xScale = scalePoint({
		domain: years,
		range: [margin.left, margin.left + width],
	});
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
			<div
				ref={getNode}
				style={{
					maxWidth: MAX_WIDTH,
				}}
			/>
			<svg
				width={width + margin.left + margin.right}
				height={HEIGHT + margin.top + margin.bottom}
			>
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
				{lineInfos.map(({ key, color, width = 1 }, i) => {
					return (
						<Group key={`line-${key}`}>
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
							<LinePath<typeof data[number]>
								curve={curveMonotoneX}
								data={data}
								x={d => xScale(d.year) ?? 0}
								y={d => yScale(d[key]) ?? 0}
								stroke={color}
								strokeWidth={width}
							/>
						</Group>
					);
				})}
				<AxisBottom axisClassName="chart-axis" scale={xScale} top={HEIGHT} />
			</svg>

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
