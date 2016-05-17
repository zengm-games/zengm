'use strict';

var g = require('../globals');
var ui = require('../ui');
var bbgmView = require('../util/bbgmView');

function updateInbox() {
    return g.dbl.messages.getAll().then(function (messages) {
        var anyUnread, i;

        messages.reverse();

        anyUnread = false;
        for (i = 0; i < messages.length; i++) {
            messages[i].text = messages[i].text.replace(/<p>/g, "").replace(/<\/p>/g, " "); // Needs to be regex otherwise it's cumbersome to do global replace
            if (!messages[i].read) {
                anyUnread = true;
            }
        }

        return {
            anyUnread: anyUnread,
            messages: messages
        };
    });
}

function uiFirst() {
    ui.title("Inbox");
}

module.exports = bbgmView.init({
    id: "inbox",
    runBefore: [updateInbox],
    uiFirst: uiFirst
});
