import g from '../globals';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import Transactions from './views/Transactions';

function get(ctx) {
    let abbrev;
    let tid;
    if (ctx.params.abbrev && ctx.params.abbrev !== "all") {
        [tid, abbrev] = helpers.validateAbbrev(ctx.params.abbrev);
    } else if (ctx.params.abbrev && ctx.params.abbrev === "all") {
        tid = -1;
        abbrev = "all";
    } else {
        tid = g.userTid;
        abbrev = g.teamAbbrevsCache[tid];
    }

    let season;
    if (ctx.params.season && ctx.params.season !== "all") {
        season = helpers.validateSeason(ctx.params.season);
    } else if (ctx.params.season && ctx.params.season === "all") {
        season = "all";
    } else {
        season = g.season;
    }

    return {
        tid,
        abbrev,
        season,
        eventType: ctx.params.eventType || 'all',
    };
}

async function updateEventLog(inputs, updateEvents, state) {
    if (updateEvents.length >= 0 || inputs.season !== state.season || inputs.abbrev !== state.abbrev || inputs.eventType !== state.eventType) {
        let events = state.events === undefined ? [] : state.events;
        if (inputs.season !== state.season || inputs.abbrev !== state.abbrev || inputs.eventType !== state.eventType) {
            events = [];
        }

        if (events.length === 0) {
            if (inputs.season === "all") {
                events = await g.dbl.events.getAll();
            } else {
                events = await g.dbl.events.index('season').getAll(inputs.season);
            }

            // Show all events, newest at top
            events.reverse(); // Newest first
        } else if (inputs.season === g.season) { // Can't update old seasons!
            // Update by adding any new events to the top of the list
            const maxEid = events[0].eid;
            const newEvents = [];
            await g.dbl.events.index('season').iterate(inputs.season, "prev", (event, shortCircuit) => {
                if (event.eid > maxEid) {
                    newEvents.push(event);
                } else {
                    shortCircuit();
                    // Oldest first (cursor is in "prev" direction and we're adding to the front of events)
                    for (let i = newEvents.length - 1; i >= 0; i--) {
                        events.unshift(newEvents[i]);
                    }
                }
            });
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

export default bbgmViewReact.init({
    id: "transactions",
    get,
    runBefore: [updateEventLog],
    Component: Transactions,
});
