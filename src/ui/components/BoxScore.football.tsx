import PropTypes from "prop-types";
import React, { ReactNode } from "react";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import { getCols } from "../util";
import { helpers, processPlayerStats } from "../../common";

const quarters = {
	Q1: "1st Quarter",
	Q2: "2nd Quarter",
	Q3: "3rd Quarter",
	Q4: "4th Quarter",
	OT: "Overtime",
};

type ScoringSummaryEvent = {
	hide: boolean;
	quarter: keyof typeof quarters;
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
};

const statsByType = {
	passing: [
		"pssCmp",
		"pss",
		"cmpPct",
		"pssYds",
		"pssTD",
		"pssInt",
		"pssSk",
		"pssSkYds",
		"qbRat",
		"fmbLost",
	],
	rushing: ["rus", "rusYds", "rusYdsPerAtt", "rusLng", "rusTD", "fmbLost"],
	receiving: ["tgt", "rec", "recYds", "recYdsPerAtt", "recLng", "recTD"],
	kicking: ["fg", "fga", "fgPct", "fgLng", "xp", "xpa", "xpPct", "kickingPts"],
	punting: ["pnt", "pntYdsPerAtt", "pntIn20", "pntTB", "pntLng", "pntBlk"],
	returns: [
		"kr",
		"krYds",
		"krYdsPerAtt",
		"krLng",
		"krTD",
		"pr",
		"prYds",
		"prYdsPerAtt",
		"prLng",
		"prTD",
	],
	defense: [
		"defTckSolo",
		"defTckAst",
		"defTck",
		"defTckLoss",
		"defSk",
		"defSft",
		"defPssDef",
		"defInt",
		"defIntYds",
		"defIntTD",
		"defIntLng",
		"defFmbFrc",
		"defFmbRec",
		"defFmbYds",
		"defFmbTD",
	],
};

const sortsByType = {
	passing: ["pssYds"],
	rushing: ["rusYds"],
	receiving: ["recYds"],
	kicking: ["kickingPts"],
	punting: ["pnt"],
	returns: ["krYds", "prYds"],
	defense: ["defTck"],
};

const StatsTable = ({
	Row,
	boxScore,
	type,
}: {
	Row: any;
	boxScore: BoxScore;
	type: keyof typeof sortsByType;
}) => {
	const stats = statsByType[type];
	const cols = getCols(...stats.map(stat => `stat:${stat}`));
	const sorts = sortsByType[type];

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
									.filter(p => {
										// Filter based on if player has any stats
										for (const stat of stats) {
											if (
												p.processed[stat] !== undefined &&
												p.processed[stat] !== 0 &&
												stat !== "fmbLost"
											) {
												return true;
											}
										}
										return false;
									})
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
		quarter: keyof typeof quarters;
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

		const prevEvent: any = processedEvents[processedEvents.length - 1];

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

const ScoringSummary = React.memo(
	({
		events,
		teams,
	}: {
		count: number;
		events: ScoringSummaryEvent[];
		teams: [Team, Team];
	}) => {
		let prevQuarter: keyof typeof quarters;

		const processedEvents = processEvents(events);

		if (processedEvents.length === 0) {
			return <p>None</p>;
		}

		return (
			<table className="table table-sm border-bottom">
				<tbody>
					{processedEvents.map((event, i) => {
						let quarterHeader: ReactNode = null;
						if (event.quarter !== prevQuarter) {
							prevQuarter = event.quarter;
							quarterHeader = (
								<tr>
									<td className="text-muted" colSpan={5}>
										{quarters[event.quarter]}
									</td>
								</tr>
							);
						}

						return (
							<React.Fragment key={i}>
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
							</React.Fragment>
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
				<React.Fragment key={title}>
					<h2>{title}</h2>
					<StatsTable
						Row={Row}
						boxScore={boxScore}
						type={title.toLowerCase() as any}
					/>
				</React.Fragment>
			))}
		</div>
	);
};

BoxScore.propTypes = {
	boxScore: PropTypes.object.isRequired,
	Row: PropTypes.any,
};

export default BoxScore;
