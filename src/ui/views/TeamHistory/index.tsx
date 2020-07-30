import PropTypes from "prop-types";
import React from "react";
import { PLAYER } from "../../../common";
import {
	DataTable,
	PlayerNameLabels,
	RecordAndPlayoffs,
} from "../../components";
import useTitleBar from "../../hooks/useTitleBar";
import { helpers, getCols } from "../../util";
import type { View } from "../../../common/types";
import RetiredJerseyNumbers from "./RetiredJerseyNumbers";

const TeamHistory = ({
	abbrev,
	bestRecord,
	championships,
	godMode,
	history,
	players,
	playoffAppearances,
	retiredJerseyNumbers,
	season,
	stats,
	team,
	tid,
	totalLost,
	totalTied,
	totalWon,
	userTid,
	worstRecord,
}: View<"teamHistory">) => {
	useTitleBar({
		title: "Team History",
		dropdownView: "team_history",
		dropdownFields: { teams: abbrev },
	});

	const historySeasons = history.map((h, i) => {
		const recordAndPlayoffs = (
			<RecordAndPlayoffs
				abbrev={abbrev}
				lost={h.lost}
				numConfs={h.numConfs}
				numPlayoffRounds={h.numPlayoffRounds}
				playoffRoundsWon={h.playoffRoundsWon}
				season={h.season}
				// Bold championship seasons.
				style={
					h.playoffRoundsWon === h.numPlayoffRounds
						? { fontWeight: "bold" }
						: undefined
				}
				tid={tid}
				tied={h.tied}
				won={h.won}
			/>
		);

		let newName;
		if (h.name && (i === 0 || h.name !== history[i - 1].name)) {
			newName = h.name;
		}

		// If a team was inactive for some number of seasons, add some vertical space in the gap
		const gap = i > 0 && h.season + 1 < history[i - 1].season;

		return (
			<div key={h.season} className={gap && !newName ? "mt-2" : undefined}>
				{newName ? (
					<h4 className={i > 0 ? "mt-2" : undefined}>{newName}</h4>
				) : null}
				{recordAndPlayoffs}
				<br />
			</div>
		);
	});

	const cols = getCols(
		"Name",
		"Pos",
		...stats.map(stat => `stat:${stat}`),
		"Last Season",
	);
	const rows = players.map(p => {
		return {
			key: p.pid,
			data: [
				<PlayerNameLabels injury={p.injury} pid={p.pid} watch={p.watch}>
					{p.name}
				</PlayerNameLabels>,
				p.pos,
				...stats.map(stat => helpers.roundStat(p.careerStats[stat], stat)),
				p.lastYr,
			],
			classNames: {
				// Highlight active and HOF players
				"table-danger": p.hof,
				"table-info": p.tid > PLAYER.RETIRED && p.tid !== team.tid, // On other team
				"table-success": p.tid === team.tid, // On this team
			},
		};
	});

	let record = `${totalWon}-${totalLost}`;
	if (totalTied > 0) {
		record += `-${totalTied}`;
	}

	return (
		<>
			<p>
				More:{" "}
				{process.env.SPORT === "football" ? (
					<>
						<a href={helpers.leagueUrl(["depth", `${abbrev}_${tid}`])}>
							Depth Chart
						</a>{" "}
						|{" "}
					</>
				) : null}
				<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`])}>Roster</a> |{" "}
				<a href={helpers.leagueUrl(["team_finances", `${abbrev}_${tid}`])}>
					Finances
				</a>{" "}
				|{" "}
				<a href={helpers.leagueUrl(["game_log", `${abbrev}_${tid}`])}>
					Game Log
				</a>{" "}
				|{" "}
				<a href={helpers.leagueUrl(["news", `${abbrev}_${tid}`])}>News Feed</a>
			</p>

			<div className="row">
				<div className="col-sm-5 col-md-3">
					<h2>Overall</h2>
					<p>
						Record: {record}
						<br />
						Playoff Appearances: {playoffAppearances}
						<br />
						Championships: {championships}
						<br />
						Best Record:{" "}
						{bestRecord ? (
							<RecordAndPlayoffs
								abbrev={abbrev}
								tid={tid}
								lost={bestRecord.lost}
								season={bestRecord.season}
								tied={bestRecord.tied}
								won={bestRecord.won}
							/>
						) : (
							"???"
						)}
						<br />
						Worst Record:{" "}
						{worstRecord ? (
							<RecordAndPlayoffs
								abbrev={abbrev}
								tid={tid}
								lost={worstRecord.lost}
								season={worstRecord.season}
								tied={worstRecord.tied}
								won={worstRecord.won}
							/>
						) : (
							"???"
						)}
					</p>

					<h2>Seasons</h2>
					{historySeasons}
				</div>
				<div className="col-sm-7 col-md-9 mt-3 mt-sm-0">
					<h2>Retired Jersey Numbers</h2>
					<RetiredJerseyNumbers
						godMode={godMode}
						players={players}
						retiredJerseyNumbers={retiredJerseyNumbers}
						season={season}
						tid={tid}
						userTid={userTid}
					/>
					<h2>Players</h2>
					<p>
						Players currently on this team are{" "}
						<span className="text-success">highlighted in green</span>. Other
						active players are{" "}
						<span className="text-info">highlighted in blue</span>. Players in
						the Hall of Fame are{" "}
						<span className="text-danger">highlighted in red</span>.
					</p>
					<DataTable
						cols={cols}
						defaultSort={[2, "desc"]}
						name="TeamHistory"
						rows={rows}
						pagination
					/>
				</div>
			</div>
		</>
	);
};

TeamHistory.propTypes = {
	abbrev: PropTypes.string.isRequired,
	bestRecord: PropTypes.shape({
		lost: PropTypes.number.isRequired,
		playoffRoundsWon: PropTypes.number.isRequired,
		season: PropTypes.number.isRequired,
		tied: PropTypes.number,
		won: PropTypes.number.isRequired,
	}).isRequired,
	championships: PropTypes.number.isRequired,
	history: PropTypes.arrayOf(
		PropTypes.shape({
			lost: PropTypes.number.isRequired,
			playoffRoundsWon: PropTypes.number.isRequired,
			season: PropTypes.number.isRequired,
			tied: PropTypes.number,
			won: PropTypes.number.isRequired,
		}),
	).isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	playoffAppearances: PropTypes.number.isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	team: PropTypes.shape({
		name: PropTypes.string.isRequired,
		region: PropTypes.string.isRequired,
		tid: PropTypes.number.isRequired,
	}).isRequired,
	tid: PropTypes.number.isRequired,
	totalLost: PropTypes.number.isRequired,
	totalTied: PropTypes.number,
	totalWon: PropTypes.number.isRequired,
	worstRecord: PropTypes.shape({
		lost: PropTypes.number.isRequired,
		playoffRoundsWon: PropTypes.number.isRequired,
		season: PropTypes.number.isRequired,
		tied: PropTypes.number,
		won: PropTypes.number.isRequired,
	}).isRequired,
};

export default TeamHistory;
