const g = require('../globals');
const ui = require('../ui');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');
const components = require('./components');

function get(req) {
    const [tid, abbrev] = helpers.validateAbbrev(req.params.abbrev);

    return {
        tid,
        abbrev,
        season: helpers.validateSeason(req.params.season)
    };
}

function InitViewModel() {
    this.abbrev = ko.observable();
    this.season = ko.observable();
    this.events = ko.observableArray([]);
}

async function updateEventLog(inputs, updateEvents, vm) {
    if (updateEvents.length >= 0 || inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev()) {
        if (inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev()) {
            vm.events([]);
        }

        if (vm.events().length === 0) {
            // Show all events, newest at top
            let events = await g.dbl.events.index('season').getAll(inputs.season);
            events.reverse(); // Newest first

            // Filter by team
            events = events.filter(function (event) {
                if (event.tids !== undefined && event.tids.indexOf(inputs.tid) >= 0) {
                    return true;
                }
            });

            events.forEach(helpers.correctLinkLid);

            return {
                abbrev: inputs.abbrev,
                events,
                season: inputs.season
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
        ui.title(`Event Log - ${vm.season()}`);
    }).extend({throttle: 1});
}

function uiEvery(updateEvents, vm) {
    components.dropdown("event-log-dropdown", ["teams", "seasons"], [vm.abbrev(), vm.season()], updateEvents);
}

module.exports = bbgmView.init({
    id: "eventLog",
    get,
    InitViewModel,
    runBefore: [updateEventLog],
    uiFirst,
    uiEvery
});
