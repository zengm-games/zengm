/**
 * @name views.eventLog
 * @namespace Event log.
 */
define(["dao", "globals", "ui", "lib/bluebird", "lib/knockout", "util/bbgmView", "util/helpers", "views/components"], function (dao, g, ui, Promise, ko, bbgmView, helpers, components) {
    "use strict";

    function get(req) {
        var out;

        out = helpers.validateAbbrev(req.params.abbrev);

        return {
            tid: out[0],
            abbrev: out[1],
            season: helpers.validateSeason(req.params.season)
        };
    }

    function InitViewModel() {
        this.abbrev = ko.observable();
        this.season = ko.observable();
        this.events = ko.observableArray([]);
    }

    function updateEventLog(inputs, updateEvents, vm) {
        var maxEid, newEvents;

        if (updateEvents.length >= 0 || inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev()) {
            if (inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev()) {
                vm.events([]);
            }

            if (vm.events().length === 0) {
                // Show all events, newest at top
                return dao.events.getAll({index: "season", key: inputs.season}).then(function (events) {
                    events.reverse(); // Newest first

                    // Filter by team
                    events = events.filter(function (event) {
                        if (event.tids !== undefined && event.tids.indexOf(inputs.tid) >= 0) {
                            return true;
                        }
                    });

                    return {
                        abbrev: inputs.abbrev,
                        events: events,
                        season: inputs.season
                    };
                });
            }

            if (inputs.season === g.season) { // Can't update old seasons!
                // Update by adding any new events to the top of the list
                maxEid = ko.unwrap(vm.events()[0].eid); // unwrap shouldn't be necessary
                newEvents = [];
                return dao.events.iterate({
                    index: "season",
                    key: inputs.season,
                    direction: "prev",
                    callback: function (event, shortCircuit) {
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
            ui.title("Event Log - " + vm.season());
        }).extend({throttle: 1});
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("event-log-dropdown", ["teams", "seasons"], [vm.abbrev(), vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "eventLog",
        get: get,
        InitViewModel: InitViewModel,
        runBefore: [updateEventLog],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});