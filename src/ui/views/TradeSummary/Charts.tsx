import { Fragment, type MouseEvent } from "react";
import type { ScaleLinear } from "d3-scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { localPoint } from "@visx/event";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
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
	stat,
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
	stat: string;
	title: string;
	valueKey: "ptsPct" | "winp" | "stat" | "statTeam";
	xDomain: [number, number];
	yScale: ScaleLinear<number, number, never>;
	yTickFormat?: (x: number) => string;
}) => {
	const MAX_WIDTH = 400;
	const STROKE_WIDTH = 1;
	const STAR_SIZE = 20;
	const colors = ["var(--bs-blue)", "var(--bs-green)"];
	const colorChamp = "var(--bs-yellow)";

	const margin = {
		top: 15,
		right: 15,
		bottom: 30,
		left: 30,
	};

	type TooltipData = (typeof seasonsToPlot)[number]["teams"][number];

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
							width={parent.width}
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
											{filtered.map((d, j) =>
												d.teams[i].champ ? (
													<text
														key={j}
														className="user-select-none fill-yellow"
														x={xScale(d.season)}
														y={yScale(d.teams[i][valueKey] ?? 0)}
														fontSize={STAR_SIZE}
														textAnchor="middle"
														alignmentBaseline="middle"
														onMouseOver={event =>
															handleMouseOver(event, d.teams[i])
														}
														onMouseOut={hideTooltip}
													>
														★
													</text>
												) : (
													<circle
														key={j}
														className="fill-white"
														r={5 * Math.sqrt(STROKE_WIDTH)}
														cx={xScale(d.season)}
														cy={yScale(d.teams[i][valueKey] ?? 0)}
														stroke={d.teams[i].champ ? colorChamp : colors[i]}
														strokeWidth={STROKE_WIDTH}
														onMouseOver={event =>
															handleMouseOver(event, d.teams[i])
														}
														onMouseOut={hideTooltip}
													/>
												),
											)}
										</Fragment>
									);
								})}
							</Group>
						</svg>
					);
				}}
			</ParentSize>
			{tooltipOpen && tooltipData ? (
				<TooltipWithBounds
					key={Math.random()}
					top={tooltipTop}
					left={tooltipLeft}
				>
					{tooltipData.season} {tooltipData.region} {tooltipData.name}
					<br />
					{helpers.formatRecord({
						won: tooltipData.won ?? 0,
						lost: tooltipData.lost ?? 0,
						otl: tooltipData.otl,
						tied: tooltipData.tied,
					})}
					{tooltipData.roundsWonText ? `, ${tooltipData.roundsWonText}` : null}
					<br />
					{helpers.roundStat(tooltipData.stat ?? 0, "ws")} {stat} (total)
					<br />
					{helpers.roundStat(tooltipData.statTeam ?? 0, "ws")} {stat} (with{" "}
					{tooltipData.abbrev})
				</TooltipWithBounds>
			) : null}
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
				stat={stat}
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
				stat={stat}
				teams={teams}
				title={`${stat} by assets received in trade (total)`}
				valueKey={"stat"}
				xDomain={xDomain}
				yScale={yScale2}
			/>

			<Chart
				className="mt-3"
				phase={phase}
				season={season}
				seasonsToPlot={seasonsToPlot}
				stat={stat}
				teams={teams}
				title={`${stat} by assets received in trade (with team)`}
				valueKey={"statTeam"}
				xDomain={xDomain}
				yScale={yScale2}
			/>
		</>
	);
};

export default Charts;
