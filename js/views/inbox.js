/**
 * @name views.inbox
 * @namespace Inbox.
 */
define(["globals", "ui", "lib/jquery", "util/bbgmView", "util/viewHelpers"], function (g, ui, $, bbgmView, viewHelpers) {
    "use strict";

    function updateInbox() {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        g.dbl.transaction("messages").objectStore("messages").getAll().onsuccess = function (event) {
            var anyUnread, i, messages;

            messages = event.target.result;
            messages.reverse();

            anyUnread = false;
            for (i = 0; i < messages.length; i++) {
                messages[i].text = messages[i].text.replace(/<p>/g, "").replace(/<\/p>/g, " "); // Needs to be regex otherwise it's cumbersome to do global replace
                if (!messages[i].read) {
                    anyUnread = true;
                }
            }

            vars = {
                anyUnread: anyUnread,
                messages: messages
            };

            deferred.resolve(vars);
        };

        return deferred.promise();
    }

    function uiFirst() {
        ui.title("Inbox");
    }

    return bbgmView.init({
        id: "inbox",
        runBefore: [updateInbox],
        uiFirst: uiFirst
    });
});