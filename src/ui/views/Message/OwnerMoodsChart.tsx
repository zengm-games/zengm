import { defineChart, dot, lineY, ruleY, text } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { decorative } from "@tanstack/charts/mark/decorative";
import { Chart } from "@tanstack/charts/react/tooltip";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { tooltip } from "@tanstack/charts/tooltip";
import { curveMonotoneX } from "d3-shape";
import { useMemo } from "react";
import { HelpPopover } from "../../components/HelpPopover.tsx";
import type { View } from "../../../common/types.ts";
import { helpers } from "../../util/helpers.ts";

export const REFERENCE_LINE_DASHARRAY = "5 5";
export const LINE_CURVE = d3Curve(curveMonotoneX);

const OwnerMoodsChart = ({
	ownerMoods,
}: {
	ownerMoods: NonNullable<
		NonNullable<View<"message">["message"]>["ownerMoods"]
	>;
}) => {
	const MAX_WIDTH = 400;
	const HEIGHT = 420;
	const STAR_SIZE = 40;

	const definition = useMemo(() => {
		const data = ownerMoods.map((mood) => {
			return {
				...mood,
				season: String(mood.season),
			};
		});
		const allValues: number[] = [];
		for (const row of data) {
			allValues.push(row.money, row.playoffs, row.total, row.wins);
		}

		// totals span -1 to 3, others -3 to 1
		const yDomain = [Math.min(-1.3, ...allValues), Math.max(3.3, ...allValues)];

		const lineInfos: {
			key: "wins" | "playoffs" | "money";
			color: string;
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
		];
		const totalColor = "var(--bs-dark)";
		const totalWidth = 4;

		const lastSeason = data.at(-1)?.season;
		const referenceLabels =
			lastSeason === undefined
				? []
				: [
						{
							season: lastSeason,
							y: 3,
							label: "Perfect",
							color: "var(--bs-success)",
							dy: -10,
						},
						{
							season: lastSeason,
							y: -1,
							label: "You're fired!",
							color: "var(--bs-danger)",
							dy: 12,
						},
					];

		return defineChart({
			marks: [
				ruleY([3], {
					stroke: "var(--bs-success)",
					strokeOpacity: 1,
					strokeDasharray: REFERENCE_LINE_DASHARRAY,
				}),
				ruleY([-1], {
					stroke: "var(--bs-danger)",
					strokeOpacity: 1,
					strokeDasharray: REFERENCE_LINE_DASHARRAY,
				}),
				ruleY([0], {
					stroke: "var(--bs-secondary)",
					strokeOpacity: 1,
					strokeDasharray: REFERENCE_LINE_DASHARRAY,
				}),
				decorative(
					text(referenceLabels, {
						x: "season",
						y: "y",
						text: "label",
						fill: (d) => d.color,
						anchor: "end",
						dx: -4,
						dy: (d) => d.dy,
					}),
				),
				...lineInfos.flatMap(({ key, color }) => [
					decorative(
						lineY(data, {
							x: "season",
							y: key,
							stroke: color,
							strokeWidth: 1,
							curve: LINE_CURVE,
						}),
					),
					decorative(
						dot(data, {
							x: "season",
							y: key,
							r: 3,
							fill: "var(--bs-white)",
							stroke: color,
							strokeWidth: 1,
						}),
					),
				]),

				// Only the total line has tooltips
				decorative(
					lineY(data, {
						x: "season",
						y: "total",
						stroke: totalColor,
						strokeWidth: totalWidth,
						curve: LINE_CURVE,
					}),
				),
				dot(
					data.filter((d) => !d.seasonInfo?.champ),
					{
						x: "season",
						y: "total",
						r: 3 * Math.sqrt(totalWidth),
						fill: "var(--bs-white)",
						stroke: totalColor,
						strokeWidth: totalWidth,
					},
				),
				text(
					data.filter((d) => d.seasonInfo?.champ),
					{
						x: "season",
						y: "total",
						text: () => "★",
						fill: "var(--bs-yellow)",
						fontSize: STAR_SIZE,
					},
				),
			],
			scales: {
				x: {
					scale: scalePoint<string>().domain(data.map((row) => row.season)),
					axis: {
						ticks: {
							size: 5,
						},
					},
				},
				y: {
					scale: scaleLinear().domain(yDomain),
					axis: false,
				},
			},
			margin: {
				top: 0,
				right: 15,
				left: 15,
			},
			tooltip,
		});
	}, [ownerMoods]);

	return (
		<div className="position-relative mt-n1" style={{ maxWidth: MAX_WIDTH }}>
			<HelpPopover
				title="Owner Mood History"
				style={{
					position: "absolute",
					left: 15,
					top: 5,
					zIndex: 1,
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
			<Chart
				definition={definition}
				height={HEIGHT}
				initialWidth={MAX_WIDTH}
				ariaLabel="Owner mood history"
				renderTooltipBody={({ points }) => {
					const row = points[0]?.datum;
					if (!row) {
						return null;
					}

					return (
						<>
							<b>{row.season}</b>
							{row.seasonInfo ? (
								<>
									<br />
									{helpers.formatRecord(row.seasonInfo)},{" "}
									{row.seasonInfo.roundsWonText}
									<br />
									Profit: {helpers.formatCurrency(row.seasonInfo.profit, "M")}
								</>
							) : null}
						</>
					);
				}}
			/>

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
