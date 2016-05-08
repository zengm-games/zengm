const g = require('../globals');
const ui = require('../ui');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');
const components = require('./components');

function get(req) {
    let abbrev, tid;
    if (req.params.abbrev && req.params.abbrev !== "all") {
        [tid, abbrev] = helpers.validateAbbrev(req.params.abbrev);
    } else if (req.params.abbrev && req.params.abbrev === "all") {
        tid = -1;
        abbrev = "all";
    } else {
        tid = g.userTid;
        abbrev = g.teamAbbrevsCache[tid];
    }

    let season;
    if (req.params.season && req.params.season !== "all") {
        season = helpers.validateSeason(req.params.season);
    } else if (req.params.season && req.params.season === "all") {
        season = "all";
    } else {
        season = g.season;
    }

    return {
        tid,
        abbrev,
        season,
        eventType: req.params.eventType || 'all'
    };
}

function InitViewModel() {
    this.abbrev = ko.observable();
    this.season = ko.observable();
    this.eventType = ko.observable();
    this.events = ko.observableArray([]);
}

async function updateEventLog(inputs, updateEvents, vm) {
    if (updateEvents.length >= 0 || inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev() || inputs.eventType !== vm.eventType) {
        if (inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev() || inputs.eventType !== vm.eventType) {
            vm.events([]);
        }

        if (vm.events().length === 0) {
            let events;
            if (inputs.season === "all") {
                events = await g.dbl.events.getAll();
            } else {
                events = await g.dbl.events.index('season').getAll(inputs.season);
            }

            // Show all events, newest at top
            events.reverse(); // Newest first

            // Filter by team
            if (inputs.abbrev !== "all") {
                events = events.filter(event => event.tids !== undefined && event.tids.indexOf(inputs.tid) >= 0);
            }

            if (inputs.eventType === "all") {
                events = events.filter(event => event.type === 'reSigned' || event.type === 'released' || event.type === 'trade' || event.type === 'freeAgent' || event.type === 'draft');
            } else {
                events = events.filter(event => event.type === inputs.eventType);
            }

            events.forEach(helpers.correctLinkLid);

            return {
                abbrev: inputs.abbrev,
                events,
                season: inputs.season,
                eventType: inputs.eventType
            };
        }

        if (inputs.season === g.season) { // Can't update old seasons!
            // Update by adding any new events to the top of the list
            const maxEid = ko.unwrap(vm.events()[0].eid); // unwrap shouldn't be necessary
            const newEvents = [];
            await g.dbl.events.index('season').iterate(inputs.season, "prev", (event, shortCircuit) => {
                if (event.eid > maxEid) {
                    if (event.tids !== undefined && event.tids.indexOf(inputs.tid) >= 0) {
                        newEvents.push(event);
                    }
                } else {
                    shortCircuit();
                    // Oldest first (cursor is in "prev" direction and we're adding to the front of vm.events)
                    for (let i = newEvents.length - 1; i >= 0; i--) {
                        vm.events.unshift(newEvents[i]);
                    }
                }
            });

            return {
                season: inputs.season
            };
        }
    }
}

function uiFirst(vm) {
    ko.computed(() => {
        ui.title(`Transactions - ${vm.season()}`);
    }).extend({
        throttle: 1
    });
}

function uiEvery(updateEvents, vm) {
    components.dropdown("event-log-dropdown", ["teamsAndAll", "seasonsAndAll", "eventType"], [vm.abbrev(), vm.season(), vm.eventType()], updateEvents);
}

module.exports = bbgmView.init({
    id: "transactions",
    get,
    InitViewModel,
    runBefore: [updateEventLog],
    uiFirst,
    uiEvery
});

