// @flow

import {g, helpers} from '../../common';
import {idb} from '../db';
import type {UpdateEvents} from '../../common/types';

async function updateEventLog(
    inputs: {
        abbrev: string,
        eventType: string,
        season: number | 'all',
        tid: number,
    },
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    if (updateEvents.length >= 0 || inputs.season !== state.season || inputs.abbrev !== state.abbrev || inputs.eventType !== state.eventType) {
        let events = state.events === undefined ? [] : state.events;
        if (inputs.season !== state.season || inputs.abbrev !== state.abbrev || inputs.eventType !== state.eventType) {
            events = [];
        }

        if (events.length === 0) {
            if (inputs.season === "all") {
                events = await idb.getCopies.events();
            } else {
                events = await idb.getCopies.events({season: inputs.season});
            }
            events.reverse(); // Newest first
        } else if (inputs.season === g.season) { // Can't update old seasons!
            // Update by adding any new events to the top of the list
            const maxEid = events[0].eid;

            const cachedEvents = await idb.cache.events.getAll();
            for (const event of cachedEvents) {
                if (event.eid > maxEid) {
                    if (event.tids !== undefined && event.tids.includes(inputs.tid)) {
                        // events has newest first
                        events.unshift(event);
                    }
                }
            }
        }

        if (inputs.abbrev !== "all") {
            events = events.filter(event => event.tids !== undefined && event.tids.includes(inputs.tid));
        }
        if (inputs.eventType === "all") {
            events = events.filter(event => event.type === 'reSigned' || event.type === 'release' || event.type === 'trade' || event.type === 'freeAgent' || event.type === 'draft');
        } else {
            events = events.filter(event => event.type === inputs.eventType);
        }

        events.forEach(helpers.correctLinkLid);

        return {
            abbrev: inputs.abbrev,
            events,
            season: inputs.season,
            eventType: inputs.eventType,
        };
    }
}

export default {
    runBefore: [updateEventLog],
};
