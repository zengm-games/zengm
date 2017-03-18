import classNames from 'classnames';
import React from 'react';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import {Dropdown, NewWindowLink} from '../components';

const Schedule = ({abbrev, completed, season, teamInfo, upcoming}) => {
    bbgmViewReact.title('Schedule');

    return <div>
        <Dropdown view="schedule" fields={["teams"]} values={[abbrev]} />
        <h1>Schedule <NewWindowLink /></h1>

        <div className="row">
            <div className="col-sm-6">
                <h2>Upcoming Games</h2>
                <ul className="list-group">
                    {upcoming.map(({gid, teams}) => <li className="list-group-item schedule-row" key={gid}>
                        <span className="playoff-matchup-logo"><img src={teamInfo[teams[0].tid].imgURL} alt="" /></span>&nbsp;
                        <a href={helpers.leagueUrl(['roster', teams[0].abbrev])}>{teams[0].region}</a> <span className="schedule-extra">({teamInfo[teams[0].tid].won}-{teamInfo[teams[0].tid].lost})</span>
                        <span className="schedule-at"> @ </span>
                        &nbsp;<span className="playoff-matchup-logo"><img src={teamInfo[teams[1].tid].imgURL} alt="" /></span>&nbsp;
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
                            <span className="playoff-matchup-logo"><img src={teamInfo[teams[0].tid].imgURL} alt="" /></span>&nbsp;
                            <a href={helpers.leagueUrl(['roster', teams[0].abbrev])}>{teams[0].region}</a>
                            <span className="schedule-at"> @ </span>
                            &nbsp;<span className="playoff-matchup-logo"><img src={teamInfo[teams[1].tid].imgURL} alt="" /></span>&nbsp;
                            <a href={helpers.leagueUrl(['roster', teams[1].abbrev])}>{teams[1].region}</a>
                        </li>;
                    })}
                </ul>
            </div>
        </div>
    </div>;
};

Schedule.propTypes = {
    abbrev: React.PropTypes.string.isRequired,
    completed: React.PropTypes.arrayOf(React.PropTypes.object),
    season: React.PropTypes.number.isRequired,
    teamInfo: React.PropTypes.objectOf(React.PropTypes.shape({
        lost: React.PropTypes.number.isRequired,
        won: React.PropTypes.number.isRequired,
    })).isRequired,
    upcoming: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
};

export default Schedule;
