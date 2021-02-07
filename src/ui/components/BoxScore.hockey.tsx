import PropTypes from "prop-types";
import { memo, Fragment, ReactNode } from "react";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import { getCols } from "../util";
import { getPeriodName, helpers, processPlayerStats } from "../../common";
import type { PlayByPlayEventScore } from "../../worker/core/GameSim.hockey/PlayByPlayLogger";
import { formatClock } from "../util/processLiveGameEvents.hockey";

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

const statsByType = {
	skaters: [
		"g",
		"a",
		"pts",
		"pm",
		"pim",
		"s",
		"sPct",
		"hit",
		"blk",
		"gv",
		"tk",
		"fow",
		"fol",
		"foPct",
		"min",
		"ppMin",
		"shMin",
	],
	goalies: ["ga", "sa", "sv", "svPct", "pim", "min", "ppMin", "shMin"],
};

const sortsByType = {
	skaters: ["min"],
	goalies: ["min"],
};

const StatsTable = ({
	Row,
	title,
	type,
	t,
}: {
	Row: any;
	title: string;
	type: keyof typeof sortsByType;
	t: Team;
}) => {
	const stats = statsByType[type];
	const cols = getCols(...stats.map(stat => `stat:${stat}`));
	const sorts = sortsByType[type];

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
						{t.players
							.map(p => {
								return {
									...p,
									processed: processPlayerStats(p, stats),
								};
							})
							.filter(
								p =>
									(type === "skaters" && p.gpSkater > 0) ||
									(type === "goalies" && p.gpGoalie > 0),
							)
							.sort((a, b) => {
								for (const sort of sorts) {
									if (b.processed[sort] !== a.processed[sort]) {
										return b.processed[sort] - a.processed[sort];
									}
								}
								return 0;
							})
							.map((p, i) => (
								<Row key={p.pid} i={i} p={p} stats={stats} />
							))}
					</tbody>
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
							quarterText = "Overtime";
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

const BoxScore = ({ boxScore, Row }: { boxScore: BoxScore; Row: any }) => {
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
