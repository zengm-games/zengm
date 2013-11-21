/**
 * @name views.eventLog
 * @namespace Event log.
 */
define(["globals", "ui", "lib/jquery", "util/bbgmView", "util/viewHelpers"], function (g, ui, $, bbgmView, viewHelpers) {
    "use strict";

    function updateevents() {
        var deferred;

        deferred = $.Deferred();

        g.dbl.transaction("events").objectStore("events").getAll().onsuccess = function (event) {
            var events;

            events = event.target.result;
            events.reverse();

            deferred.resolve({
                events: events
            });
        };

        return deferred.promise();
    }

    function uiFirst() {
        ui.title("Event Log");
    }

    return bbgmView.init({
        id: "eventLog",
        runBefore: [updateevents],
        uiFirst: uiFirst
    });
});