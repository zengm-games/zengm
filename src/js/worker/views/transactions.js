import g from '../../globals';
import {getCopy, idb} from '../db';
import * as helpers from '../../util/helpers';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateEventLog(
    inputs: GetOutput,
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
                events = await getCopy.events();
            } else {
                events = await getCopy.events({season: inputs.season});
            }
            events.reverse(); // Newest first
        } else if (inputs.season === g.season) { // Can't update old seasons!
            // Update by adding any new events to the top of the list
            const maxEid = events[0].eid;

            const cachedEvents = await idb.cache.getAll('events');
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
