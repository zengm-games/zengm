/**
 * @name views.message
 * @namespace View a single message.
 */
define(["dao", "globals", "ui", "core/league", "lib/knockout", "util/bbgmView"], function (dao, g, ui, league, ko, bbgmView) {
    "use strict";

    function get(req) {
        return {
            mid: req.params.mid ? parseInt(req.params.mid, 10) : null
        };
    }

    function updateMessage(inputs, updateEvents, vm) {
        var message, readThisPageview, tx;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || vm.message.mid() !== inputs.mid) {
            tx = dao.tx("messages", "readwrite");

            readThisPageview = false;

            // If mid is null, this will open the *unread* message with the highest mid
            dao.messages.iterate({
                ot: tx,
                key: inputs.mid,
                direction: "prev",
                callback: function (messageLocal, shortCircuit) {
                    message = messageLocal;

                    if (!message.read) {
                        shortCircuit(); // Keep looking until we find an unread one!

                        message.read = true;
                        readThisPageview = true;

                        return message;
                    }
                }
            });

            return tx.complete().then(function () {
                league.updateLastDbChange();

                if (readThisPageview) {
                    if (g.gameOver) {
                        ui.updateStatus("You're fired!");
                    }

                    return ui.updatePlayMenu(null);
                }
            }).then(function () {
                return {
                    message: message
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