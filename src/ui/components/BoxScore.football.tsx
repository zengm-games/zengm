import PropTypes from "prop-types";
import { memo, Fragment, ReactNode } from "react";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import { getCols } from "../util";
import {
	filterPlayerStats,
	getPeriodName,
	helpers,
	processPlayerStats,
} from "../../common";
import { PLAYER_GAME_STATS } from "../../common/constants.football";

type Quarter = `Q${number}` | "OT";

type ScoringSummaryEvent = {
	hide: boolean;
	quarter: Quarter;
	t: 0 | 1;
	text: string;
	time: number;
	type: string;
};

type Team = {
	abbrev: string;
	name: string;
	region: string;
	players: any[];
};

type BoxScore = {
	gid: number;
	scoringSummary: ScoringSummaryEvent[];
	teams: [Team, Team];
	numPeriods?: number;
};

const StatsTable = ({
	Row,
	boxScore,
	type,
}: {
	Row: any;
	boxScore: BoxScore;
	type: keyof typeof PLAYER_GAME_STATS;
}) => {
	const stats = PLAYER_GAME_STATS[type].stats;
	const cols = getCols(stats.map(stat => `stat:${stat}`));
	const sorts = PLAYER_GAME_STATS[type].sortBy;

	return (
		<>
			{boxScore.teams.map(t => (
				<div key={t.abbrev} className="mb-3">
					<ResponsiveTableWrapper>
						<table className="table table-striped table-bordered table-sm table-hover">
							<thead>
								<tr>
									<th colSpan={2}>
										{t.region} {t.name}
									</th>
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
									.filter(p => filterPlayerStats(p, stats, type))
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
			))}
		</>
	);
};
StatsTable.propTypes = {
	boxScore: PropTypes.object.isRequired,
	Row: PropTypes.any,
	type: PropTypes.string.isRequired,
};

// Condenses TD + XP/2P into one event rather than two
const processEvents = (events: ScoringSummaryEvent[]) => {
	const processedEvents: {
		quarter: Quarter;
		score: [number, number];
		scoreType: string | null;
		t: 0 | 1;
		text: string;
		time: number;
	}[] = [];
	const score = [0, 0] as [number, number];

	for (const event of events) {
		if (event.hide) {
			continue;
		}

		const otherT = event.t === 0 ? 1 : 0;

		let scoreType: string | null = null;
		if (event.text.includes("extra point")) {
			scoreType = "XP";
			if (event.text.includes("made")) {
				score[event.t] += 1;
			}
		} else if (event.text.includes("field goal")) {
			scoreType = "FG";
			if (event.text.includes("made")) {
				score[event.t] += 3;
			}
		} else if (event.text.includes("touchdown")) {
			scoreType = "TD";
			score[event.t] += 6;
		} else if (event.text.toLowerCase().includes("two point")) {
			scoreType = "2P";
			if (!event.text.includes("failed")) {
				score[event.t] += 2;
			}
		} else if (event.text.includes("safety")) {
			scoreType = "SF";

			// Safety is recorded as part of a play by the team with the ball, so for scoring purposes we need to swap the teams here and below
			score[otherT] += 2;
		}

		const prevEvent: any = processedEvents.at(-1);

		if (prevEvent && scoreType === "XP") {
			prevEvent.score = score.slice();
			prevEvent.text += ` (${event.text})`;
		} else if (prevEvent && scoreType === "2P" && event.t === prevEvent.t) {
			prevEvent.score = score.slice();
			prevEvent.text += ` (${event.text})`;
		} else {
			processedEvents.push({
				t: scoreType === "SF" ? otherT : event.t, // See comment above about safety teams
				quarter: event.quarter,
				time: event.time,
				text: event.text,
				score: helpers.deepCopy(score),
				scoreType,
			});
		}
	}

	return processedEvents;
};

const getCount = (events: ScoringSummaryEvent[]) => {
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
		events: ScoringSummaryEvent[];
		numPeriods: number;
		teams: [Team, Team];
	}) => {
		let prevQuarter: Quarter;

		const processedEvents = processEvents(events);

		if (processedEvents.length === 0) {
			return <p>None</p>;
		}

		return (
			<table className="table table-sm border-bottom">
				<tbody>
					{processedEvents.map((event, i) => {
						let quarterText = "???";
						if (event.quarter.startsWith("OT")) {
							const overtimes = parseInt(event.quarter.replace("OT", ""));
							if (overtimes > 1) {
								quarterText = `${helpers.ordinal(overtimes)} overtime`;
							} else {
								quarterText = "Overtime";
							}
						} else {
							const quarter = parseInt(event.quarter.replace("Q", ""));
							if (!Number.isNaN(quarter)) {
								quarterText = `${helpers.ordinal(quarter)} ${getPeriodName(
									numPeriods,
								)}`;
							}
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
									<td>{event.scoreType}</td>
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
									<td>{event.time}</td>
									<td style={{ whiteSpace: "normal" }}>{event.text}</td>
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
			{[
				"Passing",
				"Rushing",
				"Receiving",
				"Kicking",
				"Punting",
				"Returns",
				"Defense",
			].map(title => (
				<Fragment key={title}>
					<h2>{title}</h2>
					<StatsTable
						Row={Row}
						boxScore={boxScore}
						type={title.toLowerCase() as any}
					/>
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
