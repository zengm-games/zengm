const classNames = require('classnames');
const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {Dropdown, NewWindowLink} = require('../components/index');

module.exports = ({abbrev, completed, season, teamInfo, upcoming = []}) => {
    bbgmViewReact.title('Schedule');

    return <div>
        <Dropdown view="schedule" fields={["teams"]} values={[abbrev]} />
        <h1>Schedule <NewWindowLink /></h1>

        <div className="row">
            <div className="col-sm-6">
                <h2>Upcoming Games</h2>
                <ul className="list-group">
                    {upcoming.map(({gid, teams}) => <li className="list-group-item schedule-row" key={gid}>
                        <a href={helpers.leagueUrl(['roster', teams[0].abbrev])}>{teams[0].region}</a> <span className="schedule-extra">({teamInfo[teams[0].tid].won}-{teamInfo[teams[0].tid].lost})</span>
                        <span className="schedule-at"> @ </span>
                        <a href={helpers.leagueUrl(['roster', teams[1].abbrev])}>{teams[1].region}</a> <span className="schedule-extra">({teamInfo[teams[1].tid].won}-{teamInfo[teams[1].tid].lost})</span>
                    </li>)}
                </ul>
            </div>
            <div className="col-sm-6 hidden-xs">
                <h2>Completed Games</h2>
                <ul className="list-group">
                    {completed === undefined ? 'Loading...' : completed.map(({gid, overtime, score, teams, won}) => {
                        const classes = classNames('list-group-item', 'schedule-row', {
                            'list-group-item-success': won,
                            'list-group-item-danger': !won,
                        });
                        return <li className={classes} key={gid}>
                            <div className="schedule-results">
                                <div className="schedule-wl">{won ? 'W' : 'L'}</div>
                                <div className="schedule-score">
                                    <a href={helpers.leagueUrl(['game_log', abbrev, season, gid])}>{score}{overtime}</a>
                                </div>
                            </div>
                            <a href={helpers.leagueUrl(['roster', teams[0].abbrev])}>{teams[0].region}</a> <span className="schedule-extra">({teamInfo[teams[0].tid].won}-{teamInfo[teams[0].tid].lost})</span>
                            <span className="schedule-at"> @ </span>
                            <a href={helpers.leagueUrl(['roster', teams[1].abbrev])}>{teams[1].region}</a> <span className="schedule-extra">({teamInfo[teams[1].tid].won}-{teamInfo[teams[1].tid].lost})</span>
                        </li>;
                    })}
                </ul>
            </div>
        </div>
    </div>;
};
