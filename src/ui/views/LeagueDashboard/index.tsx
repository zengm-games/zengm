import PropTypes from "prop-types";
import useTitleBar from "../../hooks/useTitleBar";
import { helpers } from "../../util";
import { PlayoffMatchup } from "../../components";
import Leaders from "./Leaders";
import Standings from "./Standings";
import StartingLineup from "./StartingLineup";
import TeamStats from "./TeamStats";
import type { View } from "../../../common/types";
import Headlines from "./Headlines";

const LeagueDashboard = ({
	att,
	cash,
	challengeNoRatings,
	confTeams,
	events,
	leagueLeaders,
	lost,
	messages,
	name,
	numConfs,
	numGamesToWinSeries,
	numPlayersOnCourt,
	numPlayoffRounds,
	numPlayoffTeams,
	otl,
	payroll,
	playoffRoundsWon,
	playoffsByConf,
	pointsFormula,
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
	usePts,
	userTid,
	won,
}: View<"leagueDashboard">) => {
	useTitleBar({ title: `${region} ${name} Dashboard` });

	return (
		<>
			<div className="row">
				<div className="col-xl-7 col-lg-8">
					<div className="row">
						<div className="col-sm-4 mb-sm-3">
							{showPlayoffSeries && series ? (
								<>
									<div className="mb-1 mt-2">
										<b>{seriesTitle}</b>
									</div>
									<PlayoffMatchup
										expandTeamNames
										numGamesToWinSeries={numGamesToWinSeries}
										season={season}
										// @ts-ignore
										series={series}
										userTid={userTid}
									/>
									<div className="mt-1 mb-sm-3">
										<a href={helpers.leagueUrl(["playoffs"])}>» Playoffs</a>
									</div>
								</>
							) : null}
							<div className="d-none d-sm-block mt-2">
								<Standings
									confTeams={confTeams}
									numPlayoffTeams={numPlayoffTeams}
									playoffsByConf={playoffsByConf}
									pointsFormula={pointsFormula}
									usePts={usePts}
									userTid={userTid}
								/>
							</div>
						</div>
						<div className="col-sm-8">
							<div className="text-center mb-3">
								<span style={{ fontSize: "3rem" }}>
									{won}-{lost}
									{otl > 0 ? <>-{otl}</> : null}
									{tied > 0 ? <>-{tied}</> : null}
								</span>
								<br />
								<span style={{ fontSize: "1.5rem" }}>
									{playoffRoundsWon < 0 ? (
										<span>{helpers.ordinal(rank)} in conference</span>
									) : (
										<span className="d-none d-sm-inline">
											{helpers.roundsWonText(
												playoffRoundsWon,
												numPlayoffRounds,
												numConfs,
											)}
										</span>
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
					<StartingLineup
						challengeNoRatings={challengeNoRatings}
						numPlayersOnCourt={numPlayersOnCourt}
						starters={starters}
						startersStats={startersStats}
					/>
				</div>
				<div className="col-xl-5 col-lg-4 mb-3">
					<Headlines events={events} season={season} userTid={userTid} />
				</div>
			</div>
		</>
	);
};

LeagueDashboard.propTypes = {
	att: PropTypes.number.isRequired,
	cash: PropTypes.number.isRequired,
	confTeams: PropTypes.arrayOf(PropTypes.object).isRequired,
	events: PropTypes.arrayOf(PropTypes.object).isRequired,
	leagueLeaders: PropTypes.arrayOf(PropTypes.object).isRequired,
	lost: PropTypes.number.isRequired,
	messages: PropTypes.arrayOf(PropTypes.object).isRequired,
	name: PropTypes.string.isRequired,
	numConfs: PropTypes.number.isRequired,
	numGamesToWinSeries: PropTypes.number.isRequired,
	numPlayoffRounds: PropTypes.number.isRequired,
	numPlayoffTeams: PropTypes.number.isRequired,
	payroll: PropTypes.number.isRequired,
	playoffRoundsWon: PropTypes.number.isRequired,
	playoffsByConf: PropTypes.bool.isRequired,
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
	userTid: PropTypes.number.isRequired,
	won: PropTypes.number.isRequired,
};

export default LeagueDashboard;
