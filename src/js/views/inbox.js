// @flow

import g from '../globals';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import Inbox from './views/Inbox';

async function updateInbox() {
    const messages = helpers.deepCopy([]
        .concat(await g.dbl.messages.getAll())
        .concat(await g.cache.getAll('messages')));

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

export default bbgmViewReact.init({
    id: "inbox",
    runBefore: [updateInbox],
    Component: Inbox,
});
