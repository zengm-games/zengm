import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {PHASE, g, helpers} from '../../common';
import {setTitle} from '../util';
import {NewWindowLink, PlayerNameLabels, PlayoffMatchup, RatingWithChange} from '../components';

const LeagueDashboard = ({abbrev, ast, astRank, att, cash, completed, confTeams, leagueLeaders, lost, messages, name, oppPts, oppPtsRank, payroll, playoffRoundsWon, playoffsByConference, profit, pts, ptsRank, rank, region, revenue, salaryCap, season, series, seriesTitle, showPlayoffSeries, starters, teamLeaders, trb, trbRank, upcoming, won}) => {
    setTitle('Dashboard');

    // Show the remaining number of games, only for the regular season.
    const gamesPlayed = won + lost;
    const gamesRemaining = g.numGames - gamesPlayed;
    const percentComplete = gamesPlayed / g.numGames;

    let gamesRemainingTag = null;
    if (g.phase === PHASE.REGULAR_SEASON) {
        gamesRemainingTag = <p>{gamesRemaining} games remaining ({(percentComplete * 100).toFixed(1)}% complete)</p>;
    }

    return <div>
        <h1>{region} {name} Dashboard <NewWindowLink /></h1>

        <div className="row">
            <div className="col-md-8">
                <div className="row">
                    <div className="col-sm-4 hidden-xs">
                        <h3 />
                        <table className="table table-striped table-bordered table-condensed">
                            <thead>
                                <tr><th width="100%">Team</th><th style={{textAlign: 'right'}}>GB</th></tr>
                            </thead>
                            <tbody>
                                {confTeams.map((t, i) => {
                                    return <tr key={t.tid} className={classNames({separator: i === 7 && playoffsByConference, info: t.tid === g.userTid})}>
                                        <td>{t.rank}. <a href={helpers.leagueUrl(['roster', t.abbrev])}>{t.region}</a></td>
                                        <td style={{textAlign: 'right'}}>{t.gb}</td>
                                    </tr>;
                                })}
                            </tbody>
                        </table>
                        <a href={helpers.leagueUrl(['standings'])}>» League Standings</a>
                    </div>
                    <div className="col-sm-8">
                        <div style={{textAlign: 'center'}}>
                            <span style={{fontSize: '48px'}}>{won}-{lost}</span><br />
                            <span style={{fontSize: '24px'}}>
                                {playoffRoundsWon < 0 ? <span>{helpers.ordinal(rank)} in conference</span> : helpers.roundsWonText(playoffRoundsWon)}
                            </span>
                        </div>

                        <div className="row">
                            <div className="col-xs-6">
                                <h3>Team Leaders</h3>
                                <p>
                                    <a href={helpers.leagueUrl(['player', teamLeaders.pts.pid])}>{teamLeaders.pts.name}</a>: {teamLeaders.pts.stat.toFixed(1)} pts<br />
                                    <a href={helpers.leagueUrl(['player', teamLeaders.trb.pid])}>{teamLeaders.trb.name}</a>: {teamLeaders.trb.stat.toFixed(1)} reb<br />
                                    <a href={helpers.leagueUrl(['player', teamLeaders.ast.pid])}>{teamLeaders.ast.name}</a>: {teamLeaders.ast.stat.toFixed(1)} ast<br />
                                    <a href={helpers.leagueUrl(['roster'])}>» Full Roster</a>
                                </p>
                                <h3>League Leaders</h3>
                                <p>
                                    <a href={helpers.leagueUrl(['player', leagueLeaders.pts.pid])}>{leagueLeaders.pts.name}</a>, <a href={helpers.leagueUrl(['roster', leagueLeaders.pts.abbrev])}>{leagueLeaders.pts.abbrev}</a>: {leagueLeaders.pts.stat.toFixed(1)} pts<br />
                                    <a href={helpers.leagueUrl(['player', leagueLeaders.trb.pid])}>{leagueLeaders.trb.name}</a>, <a href={helpers.leagueUrl(['roster', leagueLeaders.trb.abbrev])}>{leagueLeaders.trb.abbrev}</a>: {leagueLeaders.trb.stat.toFixed(1)} reb<br />
                                    <a href={helpers.leagueUrl(['player', leagueLeaders.ast.pid])}>{leagueLeaders.ast.name}</a>, <a href={helpers.leagueUrl(['roster', leagueLeaders.ast.abbrev])}>{leagueLeaders.ast.abbrev}</a>: {leagueLeaders.ast.stat.toFixed(1)} ast<br />
                                    <a href={helpers.leagueUrl(['leaders'])}>» League Leaders</a><br />
                                    <a href={helpers.leagueUrl(['player_stats'])}>» Player Stats</a>
                                </p>
                                <h3>Inbox</h3>
                                <table className="table table-bordered table-condensed messages-table">
                                    <tbody>
                                        {messages.map(m => <tr key={m.mid} className={m.read ? '' : 'unread'}>
                                            <td className="year"><a href={helpers.leagueUrl(['message', m.mid])}>{m.year}</a></td>
                                            <td className="from"><a href={helpers.leagueUrl(['message', m.mid])}>{m.from}</a></td>
                                        </tr>)}
                                    </tbody>
                                </table>
                                <p>
                                    <a href={helpers.leagueUrl(['inbox'])}>» All Messages</a>
                                </p>
                            </div>
                            <div className="col-xs-6">
                                <h3>Team Stats</h3>
                                <p>
                                    Points: {pts.toFixed(1)} ({helpers.ordinal(ptsRank)})<br />
                                    Allowed: {oppPts.toFixed(1)} ({helpers.ordinal(oppPtsRank)})<br />
                                    Rebounds: {trb.toFixed(1)} ({helpers.ordinal(trbRank)})<br />
                                    Assists: {ast.toFixed(1)} ({helpers.ordinal(astRank)})<br />
                                    <a href={helpers.leagueUrl(['team_stats'])}>» Team Stats</a>
                                </p>
                                <h3>Finances</h3>
                                <p>
                                    Avg Attendance: {helpers.numberWithCommas(att)}<br />
                                    Revenue (YTD): {helpers.formatCurrency(revenue, 'M')}<br />
                                    Profit (YTD): {helpers.formatCurrency(profit, 'M')}<br />
                                    Cash: {helpers.formatCurrency(cash, 'M')}<br />
                                    Payroll: {helpers.formatCurrency(payroll, 'M')}<br />
                                    Salary Cap: {helpers.formatCurrency(salaryCap, 'M')}<br />
                                    <a href={helpers.leagueUrl(['team_finances'])}>» Team Finances</a><br />
                                    <a href={helpers.leagueUrl(['league_finances'])}>» League Finances</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="clearfix visible-sm" />
            <div className="col-md-4">
                <div className="row">
                    <div className="col-md-12 col-xs-6">
                        {showPlayoffSeries ? <div>
                            <h3>Playoffs</h3>
                            <b>{seriesTitle}</b><br />
                            <PlayoffMatchup season={season} series={series} />
                            <a href={helpers.leagueUrl(['playoffs'])}>» Playoffs</a>
                        </div> : <div>
                            <h3>Upcoming Games</h3>
                            {gamesRemainingTag}
                            <ul className="list-group" style={{marginBottom: '6px'}}>
                                {upcoming.map(game => <li key={game.gid} className="list-group-item schedule-row">
                                    <a href={helpers.leagueUrl(['roster', game.teams[0].abbrev])}>{game.teams[0].region}</a>
                                    <span className="schedule-at"> @ </span>
                                    <a href={helpers.leagueUrl(['roster', game.teams[1].abbrev])}>{game.teams[1].region}</a>
                                </li>)}
                            </ul>
                            {upcoming.length === 0 ? <p>None</p> : null}
                            <a href={helpers.leagueUrl(['schedule'])}>» Schedule</a>
                        </div>}
                    </div>
                    <div className="col-md-12 col-xs-6">
                        <h3>Completed Games</h3>
                        <ul className="list-group" style={{marginBottom: '6px'}}>
                            {completed.map(game => <li key={game.gid} className={classNames('list-group-item', 'schedule-row', {'list-group-item-success': game.won, 'list-group-item-danger': !game.won})}>
                                <div className="schedule-results">
                                    <div className="schedule-wl">{game.won ? 'W' : 'L'}</div>
                                    <div className="schedule-score"><a href={helpers.leagueUrl(['game_log', abbrev, season, game.gid])}>{game.score}{game.overtime}</a></div>
                                </div>
                                <a href={helpers.leagueUrl(['roster', game.teams[0].abbrev])}>{game.teams[0].abbrev}</a>
                                <span className="schedule-at"> @ </span>
                                <a href={helpers.leagueUrl(['roster', game.teams[1].abbrev])}>{game.teams[1].abbrev}</a>
                            </li>)}
                        </ul>
                        {completed.length === 0 ? <p>None</p> : null}
                        <a href={helpers.leagueUrl(['game_log'])}>» Game Log</a>
                    </div>
                </div>
            </div>
        </div>

        <h3>Starting Lineup</h3>
        <div className="table-responsive">
            <table className="table table-striped table-bordered table-condensed">
                <thead>
                    <tr><th>Name</th><th title="Position">Pos</th><th>Age</th><th title="Years With Team">YWT</th><th title="Overall Rating">Ovr</th><th title="Potential Rating">Pot</th><th>Contract</th><th title="Games Played">GP</th><th title="Minutes Per Game">Min</th><th title="Points Per Game">Pts</th><th title="Rebounds Per Game">Reb</th><th title="Assists Per Game">Ast</th><th title="Player Efficiency Rating">PER</th></tr>
                </thead>
                <tbody>
                    {starters.map(p => <tr key={p.pid}>
                        <td>
                            <PlayerNameLabels
                                injury={p.injury}
                                pid={p.pid}
                                skills={p.ratings.skills}
                                watch={p.watch}
                            >{p.name}</PlayerNameLabels>
                        </td>
                        <td>{p.ratings.pos}</td>
                        <td>{p.age}</td>
                        <td>{p.stats.yearsWithTeam}</td>
                        <td><RatingWithChange change={p.ratings.dovr}>{p.ratings.ovr}</RatingWithChange></td>
                        <td><RatingWithChange change={p.ratings.dpot}>{p.ratings.pot}</RatingWithChange></td>
                        <td>
                            {helpers.formatCurrency(p.contract.amount, 'M')} thru {p.contract.exp}
                        </td>
                        <td>{p.stats.gp}</td>
                        <td>{p.stats.min.toFixed(1)}</td>
                        <td>{p.stats.pts.toFixed(1)}</td>
                        <td>{p.stats.trb.toFixed(1)}</td>
                        <td>{p.stats.ast.toFixed(1)}</td>
                        <td>{p.stats.per.toFixed(1)}</td>
                    </tr>)}
                </tbody>
            </table>
        </div>
        <a href={helpers.leagueUrl(['roster'])}>» Full Roster</a>
    </div>;
};

LeagueDashboard.propTypes = {
    abbrev: PropTypes.string.isRequired,
    ast: PropTypes.number.isRequired,
    astRank: PropTypes.number.isRequired,
    att: PropTypes.number.isRequired,
    cash: PropTypes.number.isRequired,
    completed: PropTypes.arrayOf(PropTypes.object).isRequired,
    confTeams: PropTypes.arrayOf(PropTypes.object).isRequired,
    leagueLeaders: PropTypes.object.isRequired,
    lost: PropTypes.number.isRequired,
    messages: PropTypes.arrayOf(PropTypes.object).isRequired,
    name: PropTypes.string.isRequired,
    oppPts: PropTypes.number.isRequired,
    oppPtsRank: PropTypes.number.isRequired,
    payroll: PropTypes.number.isRequired,
    playoffRoundsWon: PropTypes.number.isRequired,
    playoffsByConference: PropTypes.bool.isRequired,
    profit: PropTypes.number.isRequired,
    pts: PropTypes.number.isRequired,
    ptsRank: PropTypes.number.isRequired,
    rank: PropTypes.number.isRequired,
    region: PropTypes.string.isRequired,
    revenue: PropTypes.number.isRequired,
    salaryCap: PropTypes.number.isRequired,
    season: PropTypes.number.isRequired,
    series: PropTypes.object,
    seriesTitle: PropTypes.string,
    showPlayoffSeries: PropTypes.bool.isRequired,
    starters: PropTypes.arrayOf(PropTypes.object).isRequired,
    teamLeaders: PropTypes.object.isRequired,
    trb: PropTypes.number.isRequired,
    trbRank: PropTypes.number.isRequired,
    upcoming: PropTypes.arrayOf(PropTypes.object).isRequired,
    won: PropTypes.number.isRequired,
};

export default LeagueDashboard;
