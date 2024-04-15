import {
	Fragment,
	type MouseEvent,
	type ReactNode,
	useState,
	useMemo,
} from "react";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import { getCols, helpers, processPlayerStats } from "../util";
import { filterPlayerStats, getPeriodName } from "../../common";
import type { PlayByPlayEventScore } from "../../worker/core/GameSim.hockey/PlayByPlayLogger";
import { formatClock } from "../util/processLiveGameEvents.hockey";
import { PLAYER_GAME_STATS } from "../../common/constants.hockey";
import { sortByStats, StatsHeader } from "./BoxScore.football";
import updateSortBys from "./DataTable/updateSortBys";
import type { SortBy } from "./DataTable";

type Team = {
	abbrev: string;
	name: string;
	region: string;
	players: any[];
	season?: number;
};

type BoxScore = {
	gid: number;
	scoringSummary: PlayByPlayEventScore[];
	season: number;
	teams: [Team, Team];
	numPeriods?: number;
	exhibition?: boolean;
};

const StatsTable = ({
	Row,
	exhibition,
	forceRowUpdate,
	season,
	title,
	type,
	t,
}: {
	Row: any;
	exhibition?: boolean;
	forceRowUpdate: boolean;
	season: number;
	title: string;
	type: keyof typeof PLAYER_GAME_STATS;
	t: Team;
}) => {
	const stats = PLAYER_GAME_STATS[type].stats;
	const cols = getCols(stats.map(stat => `stat:${stat}`));

	const [sortBys, setSortBys] = useState(() => {
		return PLAYER_GAME_STATS[type].sortBy.map(
			stat => [stats.indexOf(stat), "desc"] as SortBy,
		);
	});

	const onClick = (event: MouseEvent, i: number) => {
		setSortBys(
			prevSortBys =>
				updateSortBys({
					cols,
					event,
					i,
					prevSortBys,
				}) ?? [],
		);
	};

	const players = t.players
		.map(p => {
			return {
				...p,
				processed: processPlayerStats(p, stats),
			};
		})
		.filter(p => filterPlayerStats(p, stats, type))
		.sort(sortByStats(stats, undefined, sortBys));

	const showFooter = players.length > 1;
	const sumsByStat: Record<string, number> = {};
	if (showFooter) {
		for (const stat of stats) {
			if (stat === "svPct") {
				sumsByStat[stat] = helpers.percentage(sumsByStat.sv, sumsByStat.sa);
			} else if (stat === "foPct") {
				sumsByStat[stat] = helpers.percentage(
					sumsByStat.fow,
					sumsByStat.fow + sumsByStat.fol,
				);
			} else if (stat === "sPct") {
				sumsByStat[stat] = helpers.percentage(sumsByStat.g, sumsByStat.s);
			} else {
				sumsByStat[stat] = 0;
				for (const p of players) {
					sumsByStat[stat] += p.processed[stat];
				}
			}
		}
	}

	const sortable = players.length > 1;
	const highlightCols = sortable ? sortBys.map(sortBy => sortBy[0]) : undefined;

	return (
		<div className="mb-3">
			<ResponsiveTableWrapper>
				<table className="table table-striped table-borderless table-sm table-hover">
					<thead>
						<tr>
							<th colSpan={2}>{title}</th>
							<StatsHeader
								cols={cols}
								onClick={onClick}
								sortBys={sortBys}
								sortable={sortable}
							/>
						</tr>
					</thead>
					<tbody>
						{players.map((p, i) => (
							<Row
								key={p.pid}
								exhibition={exhibition}
								i={i}
								p={p}
								season={season}
								stats={stats}
								forceUpdate={forceRowUpdate}
								highlightCols={highlightCols}
							/>
						))}
					</tbody>
					{showFooter ? (
						<tfoot>
							<tr>
								<th colSpan={2}>Total</th>
								{stats.map(stat => (
									<th key={stat}>
										{stat === "pm"
											? null
											: helpers.roundStat(sumsByStat[stat], stat, true)}
									</th>
								))}
							</tr>
						</tfoot>
					) : null}
				</table>
			</ResponsiveTableWrapper>
		</div>
	);
};

const processEvents = (events: PlayByPlayEventScore[]) => {
	const processedEvents: (PlayByPlayEventScore & {
		score: [number, number];
		noPoints: boolean;
	})[] = [];
	let score = [0, 0] as [number, number];
	let shootout = false;

	for (const event of events) {
		if (!shootout && event.type === "shootoutShot") {
			shootout = true;
			score = [0, 0];
		}

		let numPts = 0;
		if (event.type === "goal" || event.made) {
			numPts += 1;
		}

		score[event.t] += numPts;

		processedEvents.push({
			...event,
			score: helpers.deepCopy(score),
			noPoints: numPts === 0,
		});
	}

	return processedEvents;
};

const goalTypeTitle = (goalType: "ev" | "sh" | "pp" | "en" | "pn") => {
	switch (goalType) {
		case "ev":
			return "Even strength";
		case "sh":
			return "Short handed";
		case "pp":
			return "Power play";
		case "en":
			return "Empty net";
		case "pn":
			return "Penalty shot";
	}
};

const ScoringSummary = ({
	processedEvents,
	numPeriods,
	teams,
}: {
	processedEvents: ReturnType<typeof processEvents>;
	numPeriods: number;
	teams: [Team, Team];
}) => {
	let prevQuarter: number | "Shootout";

	if (processedEvents.length === 0) {
		return <p>None</p>;
	}

	return (
		<table className="table table-sm border-bottom">
			<tbody>
				{processedEvents.map((event, i) => {
					let quarterHeader: ReactNode = null;
					const currentPeriod =
						event.type === "shootoutShot" ? "Shootout" : event.quarter;
					if (currentPeriod !== prevQuarter) {
						prevQuarter = currentPeriod;

						let quarterText;
						if (event.type === "shootoutShot") {
							quarterText = "Shootout";
						} else if (event.quarter > numPeriods) {
							const overtimes = event.quarter - numPeriods;
							if (overtimes > 1) {
								quarterText = `${helpers.ordinal(overtimes)} overtime`;
							} else {
								quarterText = "Overtime";
							}
						} else {
							quarterText = `${helpers.ordinal(event.quarter)} ${getPeriodName(
								numPeriods,
							)}`;
						}

						quarterHeader = (
							<tr>
								<td className="text-body-secondary" colSpan={5}>
									{quarterText}
								</td>
							</tr>
						);
					}

					return (
						<Fragment key={i}>
							{quarterHeader}
							<tr>
								<td>{teams[event.t].abbrev}</td>
								<td>
									{event.score.map((pts, i) => {
										return (
											<Fragment key={i}>
												<span
													className={
														!event.noPoints && event.t === i
															? "fw-bold"
															: event.noPoints && event.t === i
																? "text-danger"
																: "text-body-secondary"
													}
												>
													{pts}
												</span>
												{i === 0 ? "-" : null}
											</Fragment>
										);
									})}
								</td>
								<td>
									{currentPeriod !== "Shootout"
										? formatClock(event.clock)
										: null}
								</td>
								<td title={goalTypeTitle(event.goalType)}>
									{event.goalType.toUpperCase()}
								</td>
								<td style={{ whiteSpace: "normal" }}>
									{event.shotType === "reboundShot"
										? "Rebound shot"
										: helpers.upperCaseFirstLetter(event.shotType)}{" "}
									by {event.names[0]}
									{event.names.length > 1 ? (
										<>
											{" "}
											<span className="text-body-secondary">
												(assist: {event.names.slice(1).join(", ")})
											</span>
										</>
									) : null}
								</td>
							</tr>
						</Fragment>
					);
				})}
			</tbody>
		</table>
	);
};

const BoxScore = ({
	boxScore,
	forceRowUpdate,
	Row,
}: {
	boxScore: BoxScore;
	forceRowUpdate: boolean;
	Row: any;
}) => {
	const processedEvents = useMemo(
		() => processEvents(boxScore.scoringSummary),
		[boxScore.scoringSummary],
	);

	return (
		<div className="mb-3">
			<h2>Scoring Summary</h2>
			<ScoringSummary
				key={boxScore.gid}
				processedEvents={processedEvents}
				numPeriods={boxScore.numPeriods ?? 4}
				teams={boxScore.teams}
			/>

			{boxScore.teams.map((t, i) => {
				return (
					<div
						key={t.abbrev}
						id={i === 0 ? "scroll-team-1" : "scroll-team-2"}
						style={{
							scrollMarginTop: 136,
						}}
					>
						<h2>
							{t.season !== undefined ? `${t.season} ` : null}
							{t.region} {t.name}
						</h2>
						{["Skaters", "Goalies"].map(title => (
							<StatsTable
								key={title}
								Row={Row}
								exhibition={boxScore.exhibition}
								forceRowUpdate={forceRowUpdate}
								season={boxScore.season}
								title={title}
								type={title.toLowerCase() as any}
								t={t}
							/>
						))}
					</div>
				);
			})}
		</div>
	);
};

export default BoxScore;
