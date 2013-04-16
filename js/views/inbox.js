/**
 * @name views.inbox
 * @namespace Inbox.
 */
define(["globals", "ui", "lib/knockout", "util/viewHelpers"], function (g, ui, ko, viewHelpers) {
    "use strict";

    var vm;

    function display(cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "inbox") {
            ui.update({
                container: "league_content",
                template: "inbox"
            });
            ko.applyBindings(vm, leagueContentEl);
        }
        ui.title("Inbox");

        cb();
    }

    function loadBefore(cb) {
        g.dbl.transaction("messages").objectStore("messages").getAll().onsuccess = function (event) {
            var anyUnread, data, i, messages;

            messages = event.target.result;
            messages.reverse();

            anyUnread = false;
            for (i = 0; i < messages.length; i++) {
                messages[i].text = messages[i].text.replace(/<p>/g, "").replace(/<\/p>/g, " "); // Needs to be regex otherwise it's cumbersome to do global replace
                if (!messages[i].read) {
                    anyUnread = true;
                }
                messages[i].read = ko.observable(messages[i].read);
            }

            vm.anyUnread(anyUnread);
            vm.messages(messages);

            cb();
        };
    }

    function update(updateEvents, cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "inbox") {
            ko.cleanNode(leagueContentEl);
            vm = {
                anyUnread: ko.observable(false),
                messages: ko.observableArray([])
            };
        }

        loadBefore(function () {
            display(cb);
        });
    }

    function get(req) {
        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            update(updateEvents, cb);
        });
    }

    return {
        update: update,
        get: get
    };
});