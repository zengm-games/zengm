// @flow

import g from '../globals';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import EventLog from './views/EventLog';

function get(ctx) {
    const [tid, abbrev] = helpers.validateAbbrev(ctx.params.abbrev);

    return {
        tid,
        abbrev,
        season: helpers.validateSeason(ctx.params.season),
    };
}

async function updateEventLog(inputs, updateEvents, state) {
    if (updateEvents.length >= 0 || inputs.season !== state.season || inputs.abbrev !== state.abbrev) {
        let events = state.events;
        if (inputs.season !== state.season || inputs.abbrev !== state.abbrev) {
            events = [];
        }

        if (events.length === 0) {
            // Show all events, newest at top
            events = await g.dbl.events.index('season').getAll(inputs.season);
            events.reverse(); // Newest first

            // Filter by team
            events = events.filter(event => event.tids !== undefined && event.tids.includes(inputs.tid));

            events.forEach(helpers.correctLinkLid);

            return {
                abbrev: inputs.abbrev,
                events,
                season: inputs.season,
            };
        }

        if (inputs.season === g.season) { // Can't update old seasons!
            // Update by adding any new events to the top of the list
            const maxEid = events[0].eid;
            const newEvents = [];
            await g.dbl.events.index('season').iterate(inputs.season, "prev", (event, shortCircuit) => {
                if (event.eid > maxEid) {
                    if (event.tids !== undefined && event.tids.includes(inputs.tid)) {
                        newEvents.push(event);
                    }
                } else {
                    shortCircuit();
                    // Oldest first (cursor is in "prev" direction and we're adding to the front of events)
                    for (let i = newEvents.length - 1; i >= 0; i--) {
                        events.unshift(newEvents[i]);
                    }
                }
            });

            return {
                events,
                season: inputs.season,
            };
        }
    }
}

export default bbgmViewReact.init({
    id: "eventLog",
    get,
    runBefore: [updateEventLog],
    Component: EventLog,
});
