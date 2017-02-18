import classNames from 'classnames';
import React from 'react';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import {Dropdown, NewWindowLink} from '../components';

const Schedule = ({abbrev, completed, season, upcoming}) => {
    bbgmViewReact.title('Schedule');

    return <div>
        <Dropdown view="schedule" fields={["teams"]} values={[abbrev]} />
        <h1>Schedule <NewWindowLink /></h1>

        <div className="row">
            <div className="col-sm-6">
                <h2>Upcoming Games</h2>
                <ul className="list-group">
                    {upcoming.map(({gid, teams}) => <li className="list-group-item schedule-row" key={gid}>
                        <a href={helpers.leagueUrl(['roster', teams[0].abbrev])}>{teams[0].region}</a> <span className="schedule-extra">({teams[0].seasonAttrs.won}-{teams[0].seasonAttrs.lost})</span>
                        <span className="schedule-at"> @ </span>
                        <a href={helpers.leagueUrl(['roster', teams[1].abbrev])}>{teams[1].region}</a> <span className="schedule-extra">({teams[1].seasonAttrs.won}-{teams[1].seasonAttrs.lost})</span>
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
                            <a href={helpers.leagueUrl(['roster', teams[0].abbrev])}>{teams[0].region}</a>
                            <span className="schedule-at"> @ </span>
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
    upcoming: React.PropTypes.arrayOf(React.PropTypes.shape({
        gid: React.PropTypes.number.isRequired,
        teams: React.PropTypes.arrayOf(React.PropTypes.shape({
            abbrev: React.PropTypes.string.isRequired,
            name: React.PropTypes.string.isRequired,
            region: React.PropTypes.string.isRequired,
            seasonAttrs: React.PropTypes.shape({
                lost: React.PropTypes.number.isRequired,
                won: React.PropTypes.number.isRequired,
            }).isRequired,
        })).isRequired,
    })).isRequired,
};

export default Schedule;
