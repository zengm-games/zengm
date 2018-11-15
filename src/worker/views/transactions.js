// @flow

import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updateEventLog(
    inputs: {
        abbrev: string,
        eventType: string,
        season: number | "all",
        tid: number,
    },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.length >= 0 ||
        inputs.season !== state.season ||
        inputs.abbrev !== state.abbrev ||
        inputs.eventType !== state.eventType
    ) {
        let events;
        if (inputs.season === "all") {
            events = await idb.getCopies.events();
        } else {
            events = await idb.getCopies.events({ season: inputs.season });
        }
        events.reverse(); // Newest first

        if (inputs.abbrev !== "all") {
            events = events.filter(
                event =>
                    event.tids !== undefined && event.tids.includes(inputs.tid),
            );
        }
        if (inputs.eventType === "all") {
            events = events.filter(
                event =>
                    event.type === "reSigned" ||
                    event.type === "release" ||
                    event.type === "trade" ||
                    event.type === "freeAgent" ||
                    event.type === "draft",
            );
        } else {
            events = events.filter(event => event.type === inputs.eventType);
        }

        events.forEach(helpers.correctLinkLid.bind(null, g.lid));

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
