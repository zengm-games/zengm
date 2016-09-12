const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {Dropdown, JumpTo, NewWindowLink, SafeHtml} = require('../components');

const Transactions = ({abbrev, eventType, events, season}) => {
    bbgmViewReact.title(`Transactions - ${season}`);

    const moreLinks = abbrev !== 'all' ? <p>
        More:{' '}
        <a href={helpers.leagueUrl(['roster', abbrev])}>Roster</a> |{' '}
        <a href={helpers.leagueUrl(['team_finances', abbrev])}>Finances</a> |{' '}
        <a href={helpers.leagueUrl(['game_log', abbrev, season])}>Game Log</a> |{' '}
        <a href={helpers.leagueUrl(['team_history', abbrev])}>History</a>
    </p> : null;

    return <div>
        <Dropdown view="transactions" fields={["teamsAndAll", "seasonsAndAll", "eventType"]} values={[abbrev, season, eventType]} />
        <JumpTo season={season} />
        <h1>Transactions <NewWindowLink /></h1>

        {moreLinks}

        <ul className="list-group">
            {events.map(e => <li key={e.eid} className="list-group-item">
                <SafeHtml dirty={e.text} />
            </li>)}
        </ul>
    </div>;
};

Transactions.propTypes = {
    abbrev: React.PropTypes.string.isRequired,
    eventType: React.PropTypes.oneOf(['all', 'draft', 'freeAgent', 'reSigned', 'release', 'trade']).isRequired,
    events: React.PropTypes.arrayOf(React.PropTypes.shape({
        eid: React.PropTypes.number.isRequired,
        text: React.PropTypes.string.isRequired,
    })).isRequired,
    season: React.PropTypes.oneOfType([
        React.PropTypes.number,
        React.PropTypes.string,
    ]).isRequired,
};

module.exports = Transactions;
