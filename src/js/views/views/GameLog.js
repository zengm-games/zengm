import classNames from 'classnames';
import React from 'react';
import * as ui from '../../ui';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import {Dropdown, NewWindowLink, PlayerNameLabels} from '../components';
import clickable from '../wrappers/clickable';

const StatsRow = clickable(({clicked, i, numPlayers, p, toggleClicked}) => {
    const classes = classNames({
        separator: i === 4 || i === numPlayers - 1,
        warning: clicked,
    });
    return <tr className={classes} onClick={toggleClicked}>
        <td>
            <PlayerNameLabels
                injury={p.injury}
                pid={p.pid}
                skills={p.skills}
            >{p.name}</PlayerNameLabels>
        </td>
        <td>{p.pos}</td>
        <td>{helpers.round(p.min, 1)}</td>
        <td>{p.fg}-{p.fga}</td>
        <td>{p.tp}-{p.tpa}</td>
        <td>{p.ft}-{p.fta}</td>
        <td>{p.orb}</td>
        <td>{p.trb}</td>
        <td>{p.ast}</td>
        <td>{p.tov}</td>
        <td>{p.stl}</td>
        <td>{p.blk}</td>
        <td>{p.ba}</td>
        <td>{p.pf}</td>
        <td>{p.pts}</td>
        <td>{helpers.plusMinus(p.pm, 0)}</td>
        <td>{helpers.gameScore(p)}</td>
    </tr>;
});

StatsRow.propTypes = {
    i: React.PropTypes.number.isRequired,
    numPlayers: React.PropTypes.number.isRequired,
    p: React.PropTypes.object.isRequired,
};

class BoxScore extends React.Component {
    constructor(props) {
        super(props);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeydown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown(e) {
        if (e.keyCode === 37 && this.props.boxScore && this.props.prevGid !== null) {
            // prev
            ui.realtimeUpdate([], helpers.leagueUrl(['game_log', this.props.abbrev, this.props.season, this.props.prevGid]));
        } else if (e.keyCode === 39 && this.props.boxScore && this.props.nextGid !== null) {
            // next
            ui.realtimeUpdate([], helpers.leagueUrl(['game_log', this.props.abbrev, this.props.season, this.props.nextGid]));
        }
    }

    render() {
        const {abbrev, boxScore, nextGid, prevGid, season} = this.props;

        return <div>
            <center>
                <h2><a href={helpers.leagueUrl(['roster', boxScore.won.abbrev, boxScore.season])}>{boxScore.won.region} {boxScore.won.name}</a> {boxScore.won.pts}, <a href={helpers.leagueUrl(['roster', boxScore.lost.abbrev, boxScore.season])}>{boxScore.lost.region} {boxScore.lost.name}</a> {boxScore.lost.pts}{boxScore.overtime}</h2>

                <table>
                    <tbody><tr><td>
                        <a
                            className={classNames('btn', 'btn-default', {disabled: prevGid === null})}
                            style={{marginRight: '30px'}}
                            href={helpers.leagueUrl(['game_log', abbrev, season, prevGid])}
                        >Prev</a>
                    </td><td style={{textAlign: 'center'}}>
                        <div className="game-log-score">
                            <table className="table table-bordered table-condensed" style={{margin: '0 auto'}}>
                                <thead>
                                    <tr>
                                        <th />
                                        {boxScore.qtrs.map(qtr => <th key={qtr}>{qtr}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {boxScore.teams.map(t => <tr key={t.abbrev}>
                                        <th><a href={helpers.leagueUrl(['roster', t.abbrev, boxScore.season])}>{t.abbrev}</a></th>
                                        {t.ptsQtrs.map((pts, i) => <td key={i}>{pts}</td>)}
                                        <th>{t.pts}</th>
                                    </tr>)}
                                </tbody>
                            </table>
                        </div>
                        <div className="game-log-four-factors">
                            <table className="table table-bordered table-condensed" style={{margin: '0 auto'}}>
                                <thead><tr /><tr><th title="Four Factors: Effective Field Goal Percentage">eFG%</th><th title="Four Factors: Turnover Percentage">TOV%</th><th title="Four Factors: Offensive Rebound Percentage">ORB%</th><th title="Four Factors: Free Throws Made Over Field Goal Attempts">FT/FGA</th></tr></thead>
                                <tbody>
                                    {boxScore.teams.map((t, i) => <tr key={t.abbrev}>
                                        <td className={t.efg >= boxScore.teams[1 - i].efg ? 'success' : null}>
                                            {helpers.round(t.efg, 1)}
                                        </td>
                                        <td className={t.tovp <= boxScore.teams[1 - i].tovp ? 'success' : null}>
                                            {helpers.round(t.tovp, 1)}
                                        </td>
                                        <td className={t.orbp >= boxScore.teams[1 - i].orbp ? 'success' : null}>
                                            {helpers.round(t.orbp, 1)}
                                        </td>
                                        <td className={t.ftpfga >= boxScore.teams[1 - i].ftpfga ? 'success' : null}>
                                            {helpers.round(t.ftpfga, 3)}
                                        </td>
                                    </tr>)}
                                </tbody>
                            </table>
                        </div>
                    </td><td>
                        <a
                            className={classNames('btn', 'btn-default', {disabled: nextGid === null})}
                            style={{marginLeft: '30px'}}
                            href={helpers.leagueUrl(['game_log', abbrev, season, nextGid])}
                        >Next</a>
                    </td></tr></tbody>
                </table>
            </center>

            {boxScore.teams.map(t => <div key={t.abbrev}>
                <h3><a href={helpers.leagueUrl(['roster', t.abbrev, boxScore.season])}>{t.region} {t.name}</a></h3>
                <div className="table-responsive">
                    <table className="table table-striped table-bordered table-condensed table-hover box-score-team">
                        <thead>
                            <tr><th>Name</th><th>Pos</th><th>Min</th><th>FG</th><th>3Pt</th><th>FT</th><th>Off</th><th>Reb</th><th>Ast</th><th>TO</th><th>Stl</th><th>Blk</th><th>BA</th><th>PF</th><th>Pts</th><th>+/-</th><th title="Game Score">GmSc</th></tr>
                        </thead>
                        <tbody>
                            {t.players.map((p, i) => {
                                return <StatsRow key={p.pid} i={i} numPlayers={t.players.length} p={p} />;
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td>Total</td>
                                <td />
                                <td>{t.min}</td>
                                <td>{t.fg}-{t.fga}</td>
                                <td>{t.tp}-{t.tpa}</td>
                                <td>{t.ft}-{t.fta}</td>
                                <td>{t.orb}</td>
                                <td>{t.trb}</td>
                                <td>{t.ast}</td>
                                <td>{t.tov}</td>
                                <td>{t.stl}</td>
                                <td>{t.blk}</td>
                                <td>{t.ba}</td>
                                <td>{t.pf}</td>
                                <td>{t.pts}</td>
                                <td />
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>)}
            <br />
            <p>Attendance: {helpers.numberWithCommas(boxScore.att)}</p>
        </div>;
    }
}

BoxScore.propTypes = {
    abbrev: React.PropTypes.string.isRequired,
    boxScore: React.PropTypes.object.isRequired,
    nextGid: React.PropTypes.number,
    prevGid: React.PropTypes.number,
    season: React.PropTypes.number.isRequired,
};

function findPrevNextGids(games = [], currentGid) {
    let prevGid = null;
    let nextGid = null;

    for (let i = 0; i < games.length; i++) {
        if (games[i].gid === currentGid) {
            if (i > 0) {
                nextGid = games[i - 1].gid;
            }
            if (i < games.length - 1) {
                prevGid = games[i + 1].gid;
            }
            break;
        }
    }

    return {prevGid, nextGid};
}

const GameLog = ({abbrev, boxScore, gamesList = {games: []}, season}) => {
    bbgmViewReact.title(`Game Log - ${season}`);

    const {nextGid, prevGid} = findPrevNextGids(gamesList.games, boxScore.gid);

    return <div>
        <Dropdown view="game_log" extraParam={boxScore.gid} fields={["teams", "seasons"]} values={[abbrev, season]} />
        <h1>Game Log <NewWindowLink /></h1>

        <p>More: <a href={helpers.leagueUrl(['roster', abbrev, season])}>Roster</a> | <a href={helpers.leagueUrl(['team_finances', abbrev])}>Finances</a> | <a href={helpers.leagueUrl(['team_history', abbrev])}>History</a> | <a href={helpers.leagueUrl(['transactions', abbrev])}>Transactions</a></p>

        <p />
        <div className="row">
            <div className="col-md-10">
                {boxScore.gid >= 0 ? <BoxScore
                    abbrev={abbrev}
                    boxScore={boxScore}
                    nextGid={nextGid}
                    prevGid={prevGid}
                    season={season}
                /> : <p>Select a game from the menu to view a box score.</p>}
            </div>

            <div className="col-md-2">
                <table className="table table-striped table-bordered table-condensed game-log-list">
                    <thead>
                        <tr><th>Opp</th><th>W/L</th><th>Score</th></tr>
                    </thead>
                    <tbody>
                        {gamesList.abbrev !== abbrev ? <tr>
                            <td colSpan="3">Loading...</td>
                        </tr> : gamesList.games.map(gm => {
                            return <tr key={gm.gid} className={gm.gid === boxScore.gid ? 'info' : null}>
                                <td className="game-log-cell">
                                    <a href={helpers.leagueUrl(['game_log', abbrev, season, gm.gid])}>
                                        {gm.home ? '' : '@'}{gm.oppAbbrev}
                                    </a>
                                </td>
                                <td className="game-log-cell">
                                    <a href={helpers.leagueUrl(['game_log', abbrev, season, gm.gid])}>
                                        {gm.won ? 'W' : 'L'}
                                    </a>
                                </td>
                                <td className="game-log-cell">
                                    <a href={helpers.leagueUrl(['game_log', abbrev, season, gm.gid])}>
                                        {gm.pts}-{gm.oppPts}{gm.overtime}
                                    </a>
                                </td>
                            </tr>;
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>;
};

GameLog.propTypes = {
    abbrev: React.PropTypes.string.isRequired,
    boxScore: React.PropTypes.object.isRequired,
    gamesList: React.PropTypes.object,
    season: React.PropTypes.number.isRequired,
};

export default GameLog;
