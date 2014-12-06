/**
 * @name views.eventLog
 * @namespace Event log.
 */
define(["globals", "ui", "lib/jquery", "lib/knockout", "util/bbgmView", "util/helpers", "util/viewHelpers", "views/components"], function (g, ui, $, ko, bbgmView, helpers, viewHelpers, components) {
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
        var deferred, maxEid, newEvents;

        if (updateEvents.length >= 0 || inputs.season !== vm.season()) {
            deferred = $.Deferred();

            if (inputs.season !== vm.season()) {
                vm.events([]);
            }

            if (vm.events().length === 0) {
                // Show all events, newest at top
                g.dbl.transaction("events").objectStore("events").index("season").getAll(inputs.season).onsuccess = function (event) {
                    var events;

                    events = event.target.result;
                    events.reverse(); // Newest first
                    deferred.resolve({
                        events: events,
                        season: inputs.season
                    });
                };
            } else if (inputs.season === g.season) { // Can't update old seasons!
                // Update by adding any new events to the top of the list
                maxEid = ko.unwrap(vm.events()[0].eid); // unwrap shouldn't be necessary
                newEvents = [];
                g.dbl.transaction("events").objectStore("events").index("season").openCursor(inputs.season, "prev").onsuccess = function (event) {
                    var cursor, i;

                    cursor = event.target.result;
                    if (cursor && cursor.value.eid > maxEid) {
                        newEvents.push(cursor.value);
                        cursor.continue();
                    } else {
                        // Oldest first (cursor is in "prev" direction and we're adding to the front of vm.events)
                        for (i = newEvents.length - 1; i >= 0; i--) {
                            vm.events.unshift(newEvents[i]);
                        }
                        deferred.resolve({
                            season: inputs.season
                        });
                    }
                };
            } else {
                deferred.resolve();
            }

            return deferred.promise();
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