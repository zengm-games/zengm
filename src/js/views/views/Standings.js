const classNames = require('classnames');
const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {Dropdown, JumpTo, NewWindowLink} = require('../components/index');
const clickable = require('../wrappers/clickable');

const DivStandingsRow = clickable(({clicked, season, t, toggleClicked}) => {
    return <tr key={t.tid} className={classNames({info: t.highlight, warning: clicked})} onClick={toggleClicked}>
        <td>
            <a href={helpers.leagueUrl(['roster', t.abbrev, season])}>{t.region} {t.name}</a>
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

const DivStandings = ({div, season}) => {
    return <div className="table-responsive">
        <table className="table table-striped table-bordered table-condensed table-hover">
            <thead>
                <tr>
                    <th width="100%">{div.name}</th>
                    <th>W</th>
                    <th>L</th>
                    <th>%</th>
                    <th>GB</th>
                    <th>Home</th>
                    <th>Road</th>
                    <th>Div</th>
                    <th>Conf</th>
                    <th>Streak</th>
                    <th>L10</th>
                </tr>
            </thead>
            <tbody>
                {div.teams.map(t => <DivStandingsRow key={t.tid} t={t} season={season} />)}
            </tbody>
        </table>
    </div>;
};

const ConfStandings = ({playoffsByConference, season, teams}) => {
    return <table className="table table-striped table-bordered table-condensed">
        <thead>
            <tr><th width="100%">Team</th><th style={{textAlign: 'right'}}>GB</th></tr>
        </thead>
        <tbody>
            {teams.map((t, i) => {
                return <tr key={t.tid} className={classNames({info: t.highlight, separator: i === 7 && playoffsByConference})}>
                    <td>{t.rank}. <a href={helpers.leagueUrl(['roster', t.abbrev, season])}>{t.region}</a></td>
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
        <Dropdown view="standings" fields={["seasons"]} values={[season]} />
        <JumpTo season={season} />
        <h1>Standings <NewWindowLink /></h1>
        {confs.map(conf => <div key={conf.cid}>
            <h2>{conf.name}</h2>
            <div className="row">
                <div className="col-sm-9">
                    {conf.divs.map(div => <DivStandings key={div.did} div={div} season={season} />)}
                </div>

                <div className="col-sm-3 hidden-xs">
                    <ConfStandings playoffsByConference={playoffsByConference} season={season} teams={conf.teams} />
                </div>
            </div>
        </div>)}
    </div>;
};
