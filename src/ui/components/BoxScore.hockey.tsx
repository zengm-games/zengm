import PropTypes from "prop-types";
import { memo, Fragment, ReactNode } from "react";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import { getCols, helpers } from "../util";
import {
	filterPlayerStats,
	getPeriodName,
	processPlayerStats,
} from "../../common";
import type { PlayByPlayEventScore } from "../../worker/core/GameSim.hockey/PlayByPlayLogger";
import { formatClock } from "../util/processLiveGameEvents.hockey";
import { PLAYER_GAME_STATS } from "../../common/constants.hockey";

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
	const sorts = PLAYER_GAME_STATS[type].sortBy;

	const players = t.players
		.map(p => {
			return {
				...p,
				processed: processPlayerStats(p, stats),
			};
		})
		.filter(p => filterPlayerStats(p, stats, type))
		.sort((a, b) => {
			for (const sort of sorts) {
				if (b.processed[sort] !== a.processed[sort]) {
					return b.processed[sort] - a.processed[sort];
				}
			}
			return 0;
		});

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

	return (
		<div key={t.abbrev} className="mb-3">
			<ResponsiveTableWrapper>
				<table className="table table-striped table-bordered table-sm table-hover">
					<thead>
						<tr>
							<th colSpan={2}>{title}</th>
							{cols.map(({ desc, title, width }, i) => {
								return (
									<th key={i} title={desc} style={{ width }}>
										{title}
									</th>
								);
							})}
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
									<td>{event.goalType.toUpperCase()}</td>
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

// @ts-ignore
ScoringSummary.propTypes = {
	events: PropTypes.array.isRequired,
	teams: PropTypes.array.isRequired,
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

BoxScore.propTypes = {
	boxScore: PropTypes.object.isRequired,
	Row: PropTypes.any,
};

export default BoxScore;
