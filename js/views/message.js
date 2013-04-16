/**
 * @name views.message
 * @namespace View a single message.
 */
define(["db", "globals", "ui", "lib/knockout", "util/viewHelpers"], function (db, g, ui, ko, viewHelpers) {
    "use strict";

    var vm;

    function display(cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "message") {
            ui.update({
                container: "league_content",
                template: "message"
            });
            ko.applyBindings(vm, leagueContentEl);
        }
        ui.title("Message From " + vm.message().from);

        cb();
    }

    function loadBefore(mid, cb) {
        var tx;

        tx = g.dbl.transaction("messages", "readwrite");

        // If mid is null, this will open the message with the highest mid
        tx.objectStore("messages").openCursor(mid, "prev").onsuccess = function (event) {
            var cursor, message;

            cursor = event.target.result;
            message = cursor.value;

            if (!message.read) {
                message.read = true;
                cursor.update(message);

                tx.oncomplete = function () {
                    db.setGameAttributes({lastDbChange: Date.now()}, function () {
                        if (g.gameOver) {
                            ui.updateStatus("You're fired! Game over!");
                        }

                        ui.updatePlayMenu(null, function () {
                            vm.message(message);
                            cb();
                        });
                    });
                };
            } else {
                vm.message(message);
                cb();
            }
        };
    }

    function update(mid, updateEvents, cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "message") {
            ko.cleanNode(leagueContentEl);
            vm = {
                message: ko.observable()
            };
        }

        if (!vm.message()) {
            loadBefore(mid, function () {
                display(cb);
            });
        } else {
            display(cb);
        }
    }

    function get(req) {
        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            var mid;

            mid = req.params.mid ? parseInt(req.params.mid, 10) : null;

            update(mid, updateEvents, cb);
        });
    }

    return {
        update: update,
        get: get
    };
});