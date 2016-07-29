const classNames = require('classnames');
const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const clickable = require('../wrappers/clickable');

const DivStandingsRow = clickable(({t, clicked, toggleClicked}) => {
    return <tr onClick={toggleClicked} key={t.tid} className={classNames({info: t.highlight, warning: clicked})}>
        <td>
            <a data-bind="attrLeagueUrl: {href: ['roster', abbrev, $parents[2].season]}">{t.region} {t.name}</a>
            <span>{t.playoffsRank ? ` (${t.playoffsRank})` : ''}</span>
        </td>
        <td>{t.won}</td>
        <td>{t.lost}</td>
        <td>{helpers.roundWinp(t.winp)}</td>
        <td>{t.gb}</td>
        <td>{t.wonHome} {t.lostHome}</td>
        <td>{t.wonAway} {t.lostAway}</td>
        <td>{t.wonDiv} {t.lostDiv}</td>
        <td>{t.wonConf} {t.lostConf}</td>
        <td>{t.streak}</td>
        <td>{t.lastTen}</td>
    </tr>;
});

const DivStandings = ({div}) => {
    return <div className="table-responsive">
        <table className="table table-striped table-bordered table-condensed table-hover standings-division">
            <thead>
                <tr><th width="100%">{div.name}</th><th>W</th><th>L</th><th>Pct</th><th>GB</th><th>Home</th><th>Road</th><th>Div</th><th>Conf</th><th>Streak</th><th>L10</th></tr>
            </thead>
            <tbody>
                {div.teams.map(t => <DivStandingsRow key={t.tid} t={t} />)}
            </tbody>
        </table>
    </div>;
};

const ConfStandings = ({playoffsByConference, teams}) => {
    return <table className="table table-striped table-bordered table-condensed">
        <thead>
            <tr><th width="100%">Team</th><th style={{textAlign: 'right'}}>GB</th></tr>
        </thead>
        <tbody>
            {teams.map((t, i) => {
                return <tr key={t.tid} className={classNames({info: t.highlight, separator: i === 7 && playoffsByConference})}>
                    <td>{t.rank}. <a data-bind="attrLeagueUrl: {href: ['roster', abbrev, $parents[1].season]}">{t.region}</a></td>
                    <td style={{textAlign: 'right'}}>{t.gb}</td>
                </tr>;
            })}
        </tbody>
    </table>;
};

module.exports = ({confs = [], playoffsByConference = true, season}) => {
    if (season === undefined) {
        bbgmViewReact.title('Standings');
    } else {
        bbgmViewReact.title(`Standings - ${season}`);
    }

    return <div>
        DROPDOWNS
        <a href="/l/55/standings/2015">2015</a>
        <a href="/l/55/standings/2016">2016</a>
        <h1>Standings NEWWINDOW</h1>
        {confs.map(conf => <div key={conf.cid}>
            <h2>{conf.name}</h2>
            <div className="row">
                <div className="col-sm-9">
                    {conf.divs.map(div => <DivStandings div={div} key={div.did} />)}
                </div>

                <div className="col-sm-3 hidden-xs">
                    <ConfStandings teams={conf.teams} playoffsByConference={playoffsByConference} />
                </div>
            </div>
        </div>)}
    </div>;
};
