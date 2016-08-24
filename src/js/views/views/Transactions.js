const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {Dropdown, JumpTo, NewWindowLink} = require('../components');

const Transactions = ({abbrev, season, eventType, events = []}) => {
    bbgmViewReact.title(`Transactions - ${season}`);

    return <div>
        <Dropdown view="transactions" fields={["teamsAndAll", "seasonsAndAll", "eventType"]} values={[abbrev, season, eventType]} />
        <JumpTo season={season} />
        <h1>Transactions <NewWindowLink /></h1>

        {
            abbrev !== 'all'
        ?
            <p >More:
            <a href={helpers.leagueUrl(['roster', abbrev])}>Roster</a> |
            <a href={helpers.leagueUrl(['team_finances', abbrev])}>Finances</a> | <a href={helpers.leagueUrl(['game_log', abbrev, season])}>Game Log</a> | <a href={helpers.leagueUrl(['team_history', abbrev])}>History</a></p>
        :
            null
        }

        <ul className="list-group">
            {events.map(e => <li key={e.eid} className="list-group-item"><span dangerouslySetInnerHTML={{__html: e.text}} /></li>)}
        </ul>
    </div>;
};

module.exports = Transactions;
