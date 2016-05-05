const g = require('../globals');
const ui = require('../ui');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');
const components = require('./components');

function get(req) {
    var abbrev, out, season, tid;

    if (req.params.abbrev && req.params.abbrev !== "all") {
        out = helpers.validateAbbrev(req.params.abbrev);
        tid = out[0];
        abbrev = out[1];
    } else if (req.params.abbrev && req.params.abbrev === "all") {
        tid = -1;
        abbrev = "all";
    } else {
        tid = g.userTid;
        abbrev = g.teamAbbrevsCache[tid];
    }

    if (req.params.season && req.params.season !== "all") {
        season = helpers.validateSeason(req.params.season);
    } else if (req.params.season && req.params.season === "all") {
        season = "all";
    } else {
        season = g.season;
    }

    return {
        tid: tid,
        abbrev: abbrev,
        season: season,
        eventType: req.params.eventType || 'all'
    };
}

function InitViewModel() {
    this.abbrev = ko.observable();
    this.season = ko.observable();
    this.eventType = ko.observable();
    this.events = ko.observableArray([]);
}

function updateEventLog(inputs, updateEvents, vm) {
    var eventsPromise, maxEid, newEvents;

    if (updateEvents.length >= 0 || inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev() || inputs.eventType !== vm.eventType) {
        if (inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev() || inputs.eventType !== vm.eventType) {
            vm.events([]);
        }

        if (vm.events().length === 0) {
            if (inputs.season === "all") {
                eventsPromise = g.dbl.events.getAll();
            } else {
                eventsPromise = g.dbl.events.index('season').getAll(inputs.season);
            }

            // Show all events, newest at top
            return eventsPromise.then(function (events) {
                events.reverse(); // Newest first

                // Filter by team
                if (inputs.abbrev !== "all") {
                    events = events.filter(function (event) {
                        if (event.tids !== undefined && event.tids.indexOf(inputs.tid) >= 0) {
                            return true;
                        }
                    });
                }

                if (inputs.eventType === "all") {
                    events = events.filter(function (event) {
                        return event.type === 'reSigned' || event.type === 'released' || event.type === 'trade' || event.type === 'freeAgent' || event.type === 'draft';
                    });
                } else {
                    events = events.filter(function (event) {
                        return event.type === inputs.eventType;
                    });
                }

                events.map(helpers.correctLinkLid);

                return {
                    abbrev: inputs.abbrev,
                    events: events,
                    season: inputs.season,
                    eventType: inputs.eventType
                };
            });
        }

        if (inputs.season === g.season) { // Can't update old seasons!
            // Update by adding any new events to the top of the list
            maxEid = ko.unwrap(vm.events()[0].eid); // unwrap shouldn't be necessary
            newEvents = [];
            return g.dbl.events.index('season').iterate(inputs.season, "prev", function (event, shortCircuit) {
                var i;

                if (event.eid > maxEid) {
                    if (event.tids !== undefined && event.tids.indexOf(inputs.tid) >= 0) {
                        newEvents.push(event);
                    }
                } else {
                    shortCircuit();
                    // Oldest first (cursor is in "prev" direction and we're adding to the front of vm.events)
                    for (i = newEvents.length - 1; i >= 0; i--) {
                        vm.events.unshift(newEvents[i]);
                    }
                }
            }).then(function () {
                return {
                    season: inputs.season
                };
            });
        }
    }
}

function uiFirst(vm) {
    ko.computed(function () {
        ui.title("Transactions - " + vm.season());
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

