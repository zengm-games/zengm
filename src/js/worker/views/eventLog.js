// @flow

import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updateEventLog(
    inputs: {
        abbrev: string,
        season: number,
        tid: number,
    },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.length >= 0 ||
        inputs.season !== state.season ||
        inputs.abbrev !== state.abbrev
    ) {
        let events = state.events;
        if (inputs.season !== state.season || inputs.abbrev !== state.abbrev) {
            events = [];
        }

        if (events.length === 0) {
            // Show all events, newest at top
            events = await idb.getCopies.events({ season: inputs.season });
            events.reverse(); // Newest first

            // Filter by team
            events = events.filter(
                event =>
                    event.tids !== undefined && event.tids.includes(inputs.tid),
            );

            events.forEach(helpers.correctLinkLid.bind(null, g.lid));

            return {
                abbrev: inputs.abbrev,
                events,
                season: inputs.season,
            };
        }

        if (inputs.season === g.season) {
            // Can't update old seasons!
            // Update by adding any new events to the top of the list
            const maxEid = events[0].eid;

            const cachedEvents = await idb.cache.events.getAll();
            for (const event of cachedEvents) {
                if (event.eid > maxEid) {
                    if (
                        event.tids !== undefined &&
                        event.tids.includes(inputs.tid)
                    ) {
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
