import { memo, Fragment, MouseEvent, ReactNode, useState } from "react";
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
};

type BoxScore = {
	gid: number;
	scoringSummary: PlayByPlayEventScore[];
	teams: [Team, Team];
	numPeriods?: number;
};

const StatsTable = ({
	Row,
	forceRowUpdate,
	title,
	type,
	t,
}: {
	Row: any;
	forceRowUpdate: boolean;
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
		.sort(sortByStats(stats, sortBys));

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
				<table className="table table-striped table-sm table-hover">
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
								i={i}
								p={p}
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
	})[] = [];
	const score = [0, 0] as [number, number];

	for (const event of events) {
		if (event.hide) {
			continue;
		}

		score[event.t] += 1;

		processedEvents.push({
			...event,
			score: helpers.deepCopy(score),
		});
	}

	return processedEvents;
};

const getCount = (events: PlayByPlayEventScore[]) => {
	let count = 0;
	for (const event of events) {
		if (!event.hide) {
			count += 1;
		}
	}
	return count;
};

const goalTypeTitle = (goalType: "ev" | "sh" | "pp" | "en") => {
	switch (goalType) {
		case "ev":
			return "Even strength";
		case "sh":
			return "Short handed";
		case "pp":
			return "Power play";
		case "en":
			return "Empty net";
	}
};

const ScoringSummary = memo(
	({
		events,
		numPeriods,
		teams,
	}: {
		count: number;
		events: PlayByPlayEventScore[];
		numPeriods: number;
		teams: [Team, Team];
	}) => {
		let prevQuarter: number;
		const processedEvents = processEvents(events);

		if (processedEvents.length === 0) {
			return <p>None</p>;
		}

		return (
			<table className="table table-sm border-bottom">
				<tbody>
					{processedEvents.map((event, i) => {
						let quarterText = "???";
						if (event.quarter > numPeriods) {
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

						let quarterHeader: ReactNode = null;
						if (event.quarter !== prevQuarter) {
							prevQuarter = event.quarter;
							quarterHeader = (
								<tr>
									<td className="text-muted" colSpan={5}>
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
										{event.t === 0 ? (
											<>
												<b>{event.score[0]}</b>-
												<span className="text-muted">{event.score[1]}</span>
											</>
										) : (
											<>
												<span className="text-muted">{event.score[0]}</span>-
												<b>{event.score[1]}</b>
											</>
										)}
									</td>
									<td>{formatClock(event.clock)}</td>
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
												<span className="text-muted">
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
	},
	(prevProps, nextProps) => {
		return prevProps.count === nextProps.count;
	},
);

const BoxScore = ({
	boxScore,
	forceRowUpdate,
	Row,
}: {
	boxScore: BoxScore;
	forceRowUpdate: boolean;
	Row: any;
}) => {
	return (
		<div className="mb-3">
			<h2>Scoring Summary</h2>
			<ScoringSummary
				key={boxScore.gid}
				count={getCount(boxScore.scoringSummary)}
				events={boxScore.scoringSummary}
				numPeriods={boxScore.numPeriods ?? 4}
				teams={boxScore.teams}
			/>

			{boxScore.teams.map(t => (
				<Fragment key={t.abbrev}>
					<h2>
						{t.region} {t.name}
					</h2>
					{["Skaters", "Goalies"].map(title => (
						<StatsTable
							key={title}
							Row={Row}
							forceRowUpdate={forceRowUpdate}
							title={title}
							type={title.toLowerCase() as any}
							t={t}
						/>
					))}
				</Fragment>
			))}
		</div>
	);
};

export default BoxScore;
