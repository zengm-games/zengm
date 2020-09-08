import PropTypes from "prop-types";
import React from "react";
import useTitleBar from "../../hooks/useTitleBar";
import { helpers } from "../../util";
import type { View } from "../../../common/types";
import Overall from "./Overall";
import Players from "./Players";
import RetiredJerseyNumbers from "./RetiredJerseyNumbers";
import Seasons from "./Seasons";

const TeamHistory = ({
	abbrev,
	bestRecord,
	championships,
	finalsAppearances,
	godMode,
	history,
	players,
	playoffAppearances,
	retiredJerseyNumbers,
	season,
	stats,
	tid,
	totalLost,
	totalTied,
	totalWinp,
	totalWon,
	userTid,
	worstRecord,
}: View<"teamHistory">) => {
	useTitleBar({
		title: "Team History",
		dropdownView: "team_history",
		dropdownFields: { teams: abbrev },
	});

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
				<a href={helpers.leagueUrl(["schedule", `${abbrev}_${tid}`])}>
					Schedule
				</a>{" "}
				|{" "}
				<a href={helpers.leagueUrl(["news", `${abbrev}_${tid}`])}>News Feed</a>{" "}
				|{" "}
				<a
					href={helpers.leagueUrl([
						"player_stats",
						`${abbrev}_${tid}`,
						"career",
						process.env.SPORT === "football" ? "passing" : "totals",
					])}
				>
					Franchise Leaders
				</a>
			</p>

			<div className="row">
				<div className="col-sm-5 col-md-3">
					<Overall
						bestRecord={bestRecord}
						championships={championships}
						finalsAppearances={finalsAppearances}
						playoffAppearances={playoffAppearances}
						totalLost={totalLost}
						totalTied={totalTied}
						totalWinp={totalWinp}
						totalWon={totalWon}
						worstRecord={worstRecord}
					/>

					<Seasons history={history} />
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
					<Players players={players} stats={stats} tid={tid} />
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
