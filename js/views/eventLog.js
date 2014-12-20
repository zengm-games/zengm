/**
 * @name views.eventLog
 * @namespace Event log.
 */
define(["dao", "globals", "ui", "lib/bluebird", "lib/knockout", "util/bbgmView", "util/helpers", "views/components"], function (dao, g, ui, Promise, ko, bbgmView, helpers, components) {
    "use strict";

    function get(req) {
        return {
            season: helpers.validateSeason(req.params.season)
        };
    }

    function InitViewModel() {
        this.season = ko.observable();
        this.events = ko.observableArray([]);
    }

    function updateEventLog(inputs, updateEvents, vm) {
        var maxEid, newEvents;

        if (updateEvents.length >= 0 || inputs.season !== vm.season()) {
            if (inputs.season !== vm.season()) {
                vm.events([]);
            }

            if (vm.events().length === 0) {
                // Show all events, newest at top
                return dao.events.getAll({index: "season", key: inputs.season}).then(function (events) {
                    events.reverse(); // Newest first
                    return {
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
                    modify: function (event, shortCircuit) {
                        var i;

                        if (event.eid > maxEid) {
                            newEvents.push(event);
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
        components.dropdown("event-log-dropdown", ["seasons"], [vm.season()], updateEvents);
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