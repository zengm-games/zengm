import PropTypes from "prop-types";
import React from "react";
import { PHASE } from "../../../common";
import useTitleBar from "../../hooks/useTitleBar";
import { helpers } from "../../util";
import { CompletedGame, PlayoffMatchup } from "../../components";
import Leaders from "./Leaders";
import Standings from "./Standings";
import StartingLineup from "./StartingLineup";
import TeamStats from "./TeamStats";
import { View } from "../../../common/types";

const LeagueDashboard = ({
	abbrev,
	att,
	cash,
	completed,
	confTeams,
	leagueLeaders,
	lost,
	messages,
	name,
	numConfs,
	numGames,
	numGamesToWinSeries,
	numPlayoffRounds,
	numPlayoffTeams,
	payroll,
	phase,
	playoffRoundsWon,
	playoffsByConference,
	profit,
	rank,
	region,
	revenue,
	salaryCap,
	season,
	series,
	seriesTitle,
	showPlayoffSeries,
	starters,
	startersStats,
	teamLeaders,
	teamStats,
	tied,
	ties,
	upcoming,
	userTid,
	won,
}: View<"leagueDashboard">) => {
	useTitleBar({ title: `${region} ${name} Dashboard` });

	// Show the remaining number of games, only for the regular season.
	const gamesPlayed = won + lost + tied;
	const gamesRemaining = numGames - gamesPlayed;
	const percentComplete = gamesPlayed / numGames;

	const gamesRemainingTag =
		phase === PHASE.REGULAR_SEASON ? (
			<p>
				{gamesRemaining} games remaining ({(percentComplete * 100).toFixed(1)}%
				complete)
			</p>
		) : null;

	return (
		<>
			<div className="row">
				<div className="col-md-8">
					<div className="row">
						<div className="col-sm-4 d-none d-sm-block mb-3 pt-2">
							<Standings
								confTeams={confTeams}
								numPlayoffTeams={numPlayoffTeams}
								playoffsByConference={playoffsByConference}
								userTid={userTid}
							/>
						</div>
						<div className="col-sm-8">
							<div className="text-center mb-3">
								<span style={{ fontSize: "3rem" }}>
									{won}-{lost}
									{ties ? <>-{tied}</> : null}
								</span>
								<br />
								<span style={{ fontSize: "1.5rem" }}>
									{playoffRoundsWon < 0 ? (
										<span>{helpers.ordinal(rank)} in conference</span>
									) : (
										helpers.roundsWonText(
											playoffRoundsWon,
											numPlayoffRounds,
											numConfs,
										)
									)}
								</span>
							</div>

							<div className="row">
								<div className="col-6">
									<Leaders
										leagueLeaders={leagueLeaders}
										teamLeaders={teamLeaders}
									/>
									<h2>Inbox</h2>
									{messages.length === 0 ? (
										<p>No messages!</p>
									) : (
										<>
											<table className="table table-bordered table-sm messages-table">
												<tbody>
													{messages.map(m => (
														<tr
															key={m.mid}
															className={
																m.read ? undefined : "font-weight-bold"
															}
														>
															<td className="year">
																<a href={helpers.leagueUrl(["message", m.mid])}>
																	{m.year}
																</a>
															</td>
															<td className="from">
																<a href={helpers.leagueUrl(["message", m.mid])}>
																	{m.from}
																</a>
															</td>
														</tr>
													))}
												</tbody>
											</table>
											<p>
												<a href={helpers.leagueUrl(["inbox"])}>
													» All Messages
												</a>
											</p>
										</>
									)}
								</div>
								<div className="col-6">
									<TeamStats teamStats={teamStats} />
									<h2>Finances</h2>
									<p>
										Avg Attendance: {helpers.numberWithCommas(Math.round(att))}
										<br />
										Revenue (YTD): {helpers.formatCurrency(revenue, "M")}
										<br />
										Profit (YTD): {helpers.formatCurrency(profit, "M")}
										<br />
										Cash: {helpers.formatCurrency(cash, "M")}
										<br />
										Payroll: {helpers.formatCurrency(payroll, "M")}
										<br />
										Salary Cap: {helpers.formatCurrency(salaryCap, "M")}
										<br />
										<a href={helpers.leagueUrl(["team_finances"])}>
											» Team Finances
										</a>
										<br />
										<a href={helpers.leagueUrl(["league_finances"])}>
											» League Finances
										</a>
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="col-md-4">
					<div className="row">
						<div className="col-sm-6 col-md-12 mb-3">
							{showPlayoffSeries && series ? (
								<>
									<h2>Playoffs</h2>
									<b>{seriesTitle}</b>
									<br />
									<PlayoffMatchup
										expandTeamNames
										numGamesToWinSeries={numGamesToWinSeries}
										season={season}
										// @ts-ignore
										series={series}
										userTid={userTid}
									/>
									<br />
									<a href={helpers.leagueUrl(["playoffs"])}>» Playoffs</a>
								</>
							) : (
								<>
									<h2>Upcoming Games</h2>
									{gamesRemainingTag}
									{upcoming.map((game, i) => (
										<CompletedGame
											key={game.gid}
											game={game}
											header={i === 0}
										/>
									))}
									{upcoming.length === 0 ? <p>None</p> : null}
									<a href={helpers.leagueUrl(["schedule"])}>» Schedule</a>
								</>
							)}
						</div>
						<div className="col-sm-6 col-md-12 mb-3">
							<h2>Completed Games</h2>
							{completed.map((game, i) => (
								<CompletedGame
									key={game.gid}
									displayAbbrevs
									game={game}
									header={i === 0}
								/>
							))}
							{completed.length === 0 ? <p>None</p> : null}
							<a href={helpers.leagueUrl(["game_log"])}>» Game Log</a>
						</div>
					</div>
				</div>
			</div>

			<StartingLineup starters={starters} startersStats={startersStats} />
		</>
	);
};

LeagueDashboard.propTypes = {
	abbrev: PropTypes.string.isRequired,
	att: PropTypes.number.isRequired,
	cash: PropTypes.number.isRequired,
	completed: PropTypes.arrayOf(PropTypes.object).isRequired,
	confTeams: PropTypes.arrayOf(PropTypes.object).isRequired,
	leagueLeaders: PropTypes.arrayOf(PropTypes.object).isRequired,
	lost: PropTypes.number.isRequired,
	messages: PropTypes.arrayOf(PropTypes.object).isRequired,
	name: PropTypes.string.isRequired,
	numConfs: PropTypes.number.isRequired,
	numGames: PropTypes.number.isRequired,
	numGamesToWinSeries: PropTypes.number.isRequired,
	numPlayoffRounds: PropTypes.number.isRequired,
	numPlayoffTeams: PropTypes.number.isRequired,
	payroll: PropTypes.number.isRequired,
	phase: PropTypes.number.isRequired,
	playoffRoundsWon: PropTypes.number.isRequired,
	playoffsByConference: PropTypes.bool.isRequired,
	profit: PropTypes.number.isRequired,
	rank: PropTypes.number.isRequired,
	region: PropTypes.string.isRequired,
	revenue: PropTypes.number.isRequired,
	salaryCap: PropTypes.number.isRequired,
	season: PropTypes.number.isRequired,
	series: PropTypes.object,
	seriesTitle: PropTypes.string.isRequired,
	showPlayoffSeries: PropTypes.bool.isRequired,
	starters: PropTypes.arrayOf(PropTypes.object).isRequired,
	startersStats: PropTypes.arrayOf(PropTypes.string).isRequired,
	teamLeaders: PropTypes.arrayOf(PropTypes.object).isRequired,
	teamStats: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			rank: PropTypes.number.isRequired,
			stat: PropTypes.string.isRequired,
			value: PropTypes.number.isRequired,
		}),
	).isRequired,
	tied: PropTypes.number,
	ties: PropTypes.bool.isRequired,
	upcoming: PropTypes.arrayOf(PropTypes.object).isRequired,
	userTid: PropTypes.number.isRequired,
	won: PropTypes.number.isRequired,
};

export default LeagueDashboard;
