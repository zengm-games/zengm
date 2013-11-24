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
    }

    function updateevents(inputs, updateEvents, vm) {
        var deferred;

        if (updateEvents.length >= 0 || inputs.season !== vm.season()) {
            deferred = $.Deferred();

            g.dbl.transaction("events").objectStore("events").index("season").getAll(inputs.season).onsuccess = function (event) {
                var events;

                events = event.target.result;
                events.reverse();

                deferred.resolve({
                    events: events,
                    season: inputs.season
                });
            };

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
        runBefore: [updateevents],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});