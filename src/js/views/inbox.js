const g = require('../globals');
const bbgmViewReact = require('../util/bbgmViewReact');
const Inbox = require('./views/Inbox');

async function updateInbox() {
    const messages = await g.dbl.messages.getAll();

    messages.reverse();

    let anyUnread = false;
    for (const message of messages) {
        message.text = message.text.replace(/<p>/g, "").replace(/<\/p>/g, " "); // Needs to be regex otherwise it's cumbersome to do global replace
        if (!message.read) {
            anyUnread = true;
        }
    }

    return {
        anyUnread,
        messages,
    };
}

module.exports = bbgmViewReact.init({
    id: "inbox",
    runBefore: [updateInbox],
    Component: Inbox,
});
