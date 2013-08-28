/**
 * @name views.message
 * @namespace View a single message.
 */
define(["db", "globals", "ui", "lib/jquery", "lib/knockout", "util/bbgmView", "util/viewHelpers"], function (db, g, ui, $, ko, bbgmView, viewHelpers) {
    "use strict";

    function get(req) {
        return {
            mid: req.params.mid ? parseInt(req.params.mid, 10) : null
        };
    }

    function updateMessage(inputs, updateEvents, vm) {
        var deferred, vars, tx;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || vm.message.mid() !== inputs.mid) {
            deferred = $.Deferred();
            vars = {};

            tx = g.dbl.transaction("messages", "readwrite");

            // If mid is null, this will open the message with the highest mid
            tx.objectStore("messages").openCursor(inputs.mid, "prev").onsuccess = function (event) {
                var cursor, message;

                cursor = event.target.result;
                message = cursor.value;

                if (!message.read) {
                    message.read = true;
                    cursor.update(message);

                    tx.oncomplete = function () {
                        db.setGameAttributes({lastDbChange: Date.now()}, function () {
                            if (g.gameOver) {
                                ui.updateStatus("You're fired!");
                            }

                            ui.updatePlayMenu(null, function () {
                                vars.message = message;
                                deferred.resolve(vars);
                            });
                        });
                    };
                } else {
                    vars.message = message;
                    deferred.resolve(vars);
                }
            };

            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("Message From " + vm.message.from());
        }).extend({throttle: 1});
    }

    return bbgmView.init({
        id: "message",
        get: get,
        runBefore: [updateMessage],
        uiFirst: uiFirst
    });
});