/**
 * @name views.eventLog
 * @namespace Event log.
 */
define(["dao", "globals", "ui", "lib/bluebird", "lib/knockout", "util/bbgmView", "util/helpers", "views/components"], function (dao, g, ui, Promise, ko, bbgmView, helpers, components) {
    "use strict";

    function get(req) {
        return {
            eventType: req.params.eventType || "all",
            season: helpers.validateSeason(req.params.season)
        };
    }

    function InitViewModel() {
        this.season = ko.observable();
        this.eventType = ko.observable();
        this.events = ko.observableArray([]);
    }

    function updateEventLog(inputs, updateEvents, vm) {
        var maxEid, newEvents;

        if (updateEvents.length >= 0 || inputs.season !== vm.season() || inputs.eventType !== vm.eventType ) {
            if (inputs.season !== vm.season() || inputs.eventType !== vm.eventType ) {
                vm.events([]);
            }

            if (vm.events().length === 0) {
                // Show all events, newest at top
                return dao.events.getAll({index: "season", key: inputs.season}).then(function (events) {
                    events.reverse(); // Newest first

                    // Filter by type
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
            ui.title("All Transactions - " + vm.season());
        }).extend({throttle: 1});
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("event-log-dropdown", ["seasons", "eventType"], [vm.season(), vm.eventType()], updateEvents);
    }

    return bbgmView.init({
        id: "leagueTransaction",
        get: get,
        InitViewModel: InitViewModel,
        runBefore: [updateEventLog],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});
