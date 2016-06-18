const g = require('../globals');
const ui = require('../ui');
const bbgmView = require('../util/bbgmView');

async function updateInbox() {
    const messages = await g.dbl.messages.getAll();

    messages.reverse();

    let anyUnread = false;
    for (let i = 0; i < messages.length; i++) {
        messages[i].text = messages[i].text.replace(/<p>/g, "").replace(/<\/p>/g, " "); // Needs to be regex otherwise it's cumbersome to do global replace
        if (!messages[i].read) {
            anyUnread = true;
        }
    }

    return {
        anyUnread,
        messages,
    };
}

function uiFirst() {
    ui.title("Inbox");
}

module.exports = bbgmView.init({
    id: "inbox",
    runBefore: [updateInbox],
    uiFirst,
});
