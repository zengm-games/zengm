import { Fragment } from "react";
import type { ScaleLinear } from "d3-scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import type { View } from "../../../common/types";
import { helpers } from "../../util";
import { PHASE } from "../../../common";
import { ReferenceLine } from "../Message/OwnerMoodsChart";
import classNames from "classnames";

const HEIGHT = 200;

const Chart = ({
	className,
	phase,
	season,
	seasonsToPlot,
	teams,
	title,
	valueKey,
	xDomain,
	yScale,
	yTickFormat,
}: Pick<
	View<"tradeSummary">,
	"phase" | "season" | "seasonsToPlot" | "teams"
> & {
	className?: string;
	title: string;
	valueKey: "ptsPct" | "winp" | "stat";
	xDomain: [number, number];
	yScale: ScaleLinear<number, number, never>;
	yTickFormat?: (x: number) => string;
}) => {
	const MAX_WIDTH = 400;
	const STROKE_WIDTH = 1;
	const colors = ["var(--bs-blue)", "var(--bs-green)"];

	const margin = {
		top: 15,
		right: 15,
		bottom: 30,
		left: 30,
	};

	return (
		<div
			className={classNames("position-relative", className)}
			style={{
				maxWidth: MAX_WIDTH,
			}}
		>
			<div className="text-center">{title}</div>
			<ParentSize>
				{parent => {
					const width = parent.width - margin.left - margin.right;
					const xScale = scaleLinear({
						domain: xDomain,
						range: [0, width],
					});

					let xMarker: number;
					if (phase < PHASE.REGULAR_SEASON) {
						xMarker = xScale(season - 0.5);
					} else if (phase === PHASE.REGULAR_SEASON) {
						xMarker = xScale(season);
					} else {
						xMarker = xScale(season + 0.5);
					}

					return (
						<svg
							width={width + margin.left + margin.right}
							height={HEIGHT + margin.top + margin.bottom}
						>
							<Group transform={`translate(${margin.left},${margin.top})`}>
								<ReferenceLine
									x={xScale.range() as [number, number]}
									y={
										valueKey === "stat"
											? [yScale(0), yScale(0)]
											: [yScale(0.5), yScale(0.5)]
									}
									color="var(--bs-secondary)"
								/>
								{[0, 1].map(i => {
									const filtered = seasonsToPlot.filter(
										row => row.teams[i][valueKey] !== undefined,
									);

									return (
										<Fragment key={i}>
											<LinePath
												className="chart-line"
												curve={curveMonotoneX}
												data={filtered}
												x={d => xScale(d.season)}
												y={d => yScale(d.teams[i][valueKey] ?? 0)}
												stroke={colors[i]}
												strokeWidth={STROKE_WIDTH}
											/>
											{filtered.map((d, j) => (
												<circle
													key={j}
													className="chart-point"
													r={5 * Math.sqrt(STROKE_WIDTH)}
													cx={xScale(d.season)}
													cy={yScale(d.teams[i][valueKey] ?? 0)}
													stroke={colors[i]}
													strokeWidth={STROKE_WIDTH}
												/>
											))}
										</Fragment>
									);
								})}
								<ReferenceLine
									x={[xMarker, xMarker]}
									y={yScale.range() as [number, number]}
									color="var(--bs-danger)"
									text="Trade"
									textPosition="right"
								/>
								<AxisBottom
									axisClassName="chart-axis"
									numTicks={8}
									scale={xScale}
									tickFormat={String}
									tickLength={5}
									top={HEIGHT}
								/>
								<AxisLeft
									axisClassName="chart-axis"
									numTicks={5}
									scale={yScale}
									tickFormat={yTickFormat as any}
									tickLength={5}
								/>
							</Group>
						</svg>
					);
				}}
			</ParentSize>
			<div
				className="chart-legend"
				style={{
					top: 24,
					left: "inherit",
					right: 13,
				}}
			>
				<ul className="list-unstyled mb-0">
					{teams.map((t, i) => (
						<li key={i} style={{ color: colors[i] }}>
							— {t.abbrev}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

const Charts = ({
	phase,
	season,
	seasonsToPlot,
	stat,
	teams,
	usePts,
}: Pick<
	View<"tradeSummary">,
	"phase" | "season" | "seasonsToPlot" | "stat" | "teams" | "usePts"
>) => {
	const allStats: number[] = [];
	const seasons: number[] = [];

	for (const row of seasonsToPlot) {
		for (const team of row.teams) {
			if (team.stat !== undefined) {
				allStats.push(team.stat);
			}
		}
		seasons.push(row.season);
	}

	const xDomain = [seasons[0], seasons.at(-1)] as [number, number];

	const yScale = scaleLinear({
		domain: [0, 1],
		range: [HEIGHT, 0],
	});

	const yDomainStat = [Math.min(0, ...allStats), Math.max(1, ...allStats)];
	const yScale2 = scaleLinear({
		domain: yDomainStat,
		range: [HEIGHT, 0],
	});

	return (
		<>
			<Chart
				phase={phase}
				season={season}
				seasonsToPlot={seasonsToPlot}
				teams={teams}
				title={`Team ${
					usePts ? "point" : "winning"
				} percentages before and after the
				trade`}
				valueKey={usePts ? "ptsPct" : "winp"}
				xDomain={xDomain}
				yScale={yScale}
				yTickFormat={helpers.roundWinp}
			/>

			<Chart
				className="mt-3"
				phase={phase}
				season={season}
				seasonsToPlot={seasonsToPlot}
				teams={teams}
				title={`${stat} by assets received in trade`}
				valueKey={"stat"}
				xDomain={xDomain}
				yScale={yScale2}
			/>
		</>
	);
};

export default Charts;
