import { defineChart, dot, lineY, ruleX, ruleY, text } from "@tanstack/charts";
import { decorative } from "@tanstack/charts/mark/decorative";
import { Chart as TanStackChart } from "@tanstack/charts/react/tooltip";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { useMemo } from "react";
import type { View } from "../../../common/types.ts";
import { helpers } from "../../util/helpers.ts";
import { PHASE } from "../../../common/constants.ts";
import {
	LINE_CURVE,
	REFERENCE_LINE_DASHARRAY,
} from "../Message/OwnerMoodsChart.tsx";
import clsx from "clsx";

const HEIGHT = 230;
const MAX_WIDTH = 400;
const STROKE_WIDTH = 1;
const STAR_SIZE = 20;
const COLORS = ["var(--bs-blue)", "var(--bs-green)"];

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
	yDomain,
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
	yDomain: [number, number];
	yTickFormat?: (x: number) => string;
}) => {
	const [xMin, xMax] = xDomain;
	const [yMin, yMax] = yDomain;

	const definition = useMemo(() => {
		let xMarker: number;
		if (phase < PHASE.REGULAR_SEASON) {
			xMarker = season - 0.5;
		} else if (phase === PHASE.REGULAR_SEASON) {
			xMarker = season;
		} else {
			xMarker = season + 0.5;
		}

		return defineChart({
			marks: [
				ruleY([valueKey === "stat" || valueKey === "statTeam" ? 0 : 0.5], {
					stroke: "var(--bs-secondary)",
					strokeOpacity: 1,
					strokeDasharray: REFERENCE_LINE_DASHARRAY,
				}),
				ruleX([xMarker], {
					stroke: "var(--bs-danger)",
					strokeOpacity: 1,
					strokeDasharray: REFERENCE_LINE_DASHARRAY,
				}),
				decorative(
					text([{ x: xMarker, y: yMax }], {
						x: "x",
						y: "y",
						text: () => "Trade",
						fill: "var(--bs-danger)",
						anchor: "start",
						dx: 5,
						dy: 10,
					}),
				),
				...([0, 1] as const).flatMap((i) => {
					const rows = seasonsToPlot
						.map((row) => row.teams[i])
						.filter((t) => t[valueKey] !== undefined);

					return [
						decorative(
							lineY(rows, {
								x: "season",
								y: valueKey,
								stroke: COLORS[i],
								strokeWidth: STROKE_WIDTH,
								curve: LINE_CURVE,
							}),
						),
						dot(
							rows.filter((t) => !t.champ),
							{
								x: "season",
								y: valueKey,
								z: () => i,
								r: 5 * Math.sqrt(STROKE_WIDTH),
								fill: "var(--bs-white)",
								stroke: COLORS[i],
								strokeWidth: STROKE_WIDTH,
								states: [
									{
										when: { focus: "primary" },
										style: { fill: COLORS[i] },
									},
								],
							},
						),
						text(
							rows.filter((t) => t.champ),
							{
								x: "season",
								y: valueKey,
								z: () => i,
								text: () => "★",
								fill: "var(--bs-yellow)",
								fontSize: STAR_SIZE,
								states: [
									{
										when: { focus: "primary" },
										style: { fontSize: STAR_SIZE * 1.4 },
									},
								],
							},
						),
					];
				}),
			],
			scales: {
				x: {
					scale: scaleLinear().domain([xMin, xMax]),
					axis: {
						ticks: {
							values: seasonsToPlot.map((row) => row.season),
							size: 5,
							format: String,
						},
					},
				},
				y: {
					scale: scaleLinear().domain([yMin, yMax]),
					axis: {
						ticks: {
							count: 5,
							size: 5,
							format: yTickFormat,
						},
					},
				},
			},

			// Hovered point is highlighted by filling it with the team color, see states above
			focusRing: false,
			tooltip,
		});
	}, [
		phase,
		season,
		seasonsToPlot,
		valueKey,
		xMin,
		xMax,
		yMin,
		yMax,
		yTickFormat,
	]);

	return (
		<div
			className={clsx("position-relative", className)}
			style={{
				maxWidth: MAX_WIDTH,
			}}
		>
			<div className="text-center">{title}</div>
			<TanStackChart
				className="mt-2 mb-4"
				definition={definition}
				height={HEIGHT}
				initialWidth={MAX_WIDTH}
				ariaLabel={title}
				renderTooltipBody={({ points }) => {
					const point = points[0];
					if (!point) {
						return null;
					}
					const t = point.datum;

					return (
						<>
							<span style={{ color: COLORS[Number(point.group)] }}>
								{t.season} {t.region} {t.name}
							</span>
							<br />
							{helpers.formatRecord({
								won: t.won ?? 0,
								lost: t.lost ?? 0,
								otl: t.otl,
								tied: t.tied,
							})}
							{t.roundsWonText ? `, ${t.roundsWonText}` : null}
							<br />
							{helpers.roundStat(t.stat ?? 0, "ws")} {stat} (total)
							<br />
							{helpers.roundStat(t.statTeam ?? 0, "ws")} {stat} (with {t.abbrev}
							)
						</>
					);
				}}
			/>
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
						<li key={i} style={{ color: COLORS[i] }}>
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
	const pctKey = usePts ? "ptsPct" : "winp";

	const allStats: number[] = [];
	const allPcts: number[] = [];
	const seasons: number[] = [];

	for (const row of seasonsToPlot) {
		for (const team of row.teams) {
			if (team.stat !== undefined) {
				allStats.push(team.stat);
			}

			if (team[pctKey] !== undefined) {
				allPcts.push(team[pctKey]);
			}
		}
		seasons.push(row.season);
	}

	const xDomain = [seasons[0], seasons.at(-1)] as [number, number];

	const yDomainPct: [number, number] = [
		Math.min(0.25, ...allPcts),
		Math.max(0.75, ...allPcts),
	];

	const yDomainStat: [number, number] = [
		Math.min(0, ...allStats),
		Math.max(1, ...allStats),
	];

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
				valueKey={pctKey}
				xDomain={xDomain}
				yDomain={yDomainPct}
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
				yDomain={yDomainStat}
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
				yDomain={yDomainStat}
			/>
		</>
	);
};

export default Charts;
