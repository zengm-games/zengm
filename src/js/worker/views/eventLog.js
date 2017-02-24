// @flow

import g from '../../globals';
import {getCopy} from '../db';
import * as helpers from '../../util/helpers';

async function updateEventLog(inputs, updateEvents, state) {
    if (updateEvents.length >= 0 || inputs.season !== state.season || inputs.abbrev !== state.abbrev) {
        let events = state.events;
        if (inputs.season !== state.season || inputs.abbrev !== state.abbrev) {
            events = [];
        }

        if (events.length === 0) {
            // Show all events, newest at top
            events = await getCopy.events({season: inputs.season});
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

            const cachedEvents = await g.cache.getAll('events');
            for (const event of cachedEvents) {
                if (event.eid > maxEid) {
                    if (event.tids !== undefined && event.tids.includes(inputs.tid)) {
                        // events has newest first
                        events.unshift(event);
                    }
                }
            }

            return {
                events,
                season: inputs.season,
            };
        }
    }
}

export default {
    runBefore: [updateEventLog],
};
