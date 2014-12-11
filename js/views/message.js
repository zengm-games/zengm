/**
 * @name views.message
 * @namespace View a single message.
 */
define(["dao", "globals", "ui", "lib/bluebird", "lib/knockout", "util/bbgmView"], function (dao, g, ui, Promise, ko, bbgmView) {
    "use strict";

    function get(req) {
        return {
            mid: req.params.mid ? parseInt(req.params.mid, 10) : null
        };
    }

    function updateMessage(inputs, updateEvents, vm) {
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || vm.message.mid() !== inputs.mid) {
            return new Promise(function (resolve, reject) {
                var tx;

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
                            dao.gameAttributes.set({lastDbChange: Date.now()});

                            if (g.gameOver) {
                                ui.updateStatus("You're fired!");
                            }

                            ui.updatePlayMenu(null).then(function () {
                                resolve({
                                    message: message
                                });
                            });
                        };
                    } else {
                        resolve({
                            message: message
                        });
                    }
                };
            });
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