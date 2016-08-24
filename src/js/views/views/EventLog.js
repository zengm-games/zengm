const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const {Dropdown, NewWindowLink} = require('../components');

const EventLog = ({abbrev, events = [], season}) => {
    bbgmViewReact.title(`Event Log - ${season}`);

    return <div>
        <Dropdown view="event_log" fields={["teams", "seasons"]} values={[abbrev, season]} />
        <h1>Event Log <NewWindowLink /></h1>

        <ul>
            {events.map(e => <li key={e.eid} dangerouslySetInnerHTML={{__html: e.text}} />)}
        </ul>
    </div>;
};

module.exports = EventLog;
