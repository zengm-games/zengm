// @flow

import g from '../../globals';
import {league} from '../core';

/*Save status to database and push to client.

If no status is given, load the last status from the database and push that
to the client.

Args:
    status: A string containing the current status message to be pushed to
        the client.
*/
async function updateStatus(statusText?: string) {
    const oldStatus = g.statusText;
    if (statusText === undefined) {
        g.emitter.emit('updateTopMenu', {statusText: oldStatus});
    } else if (statusText !== oldStatus) {
        await league.setGameAttributes({statusText});
        g.emitter.emit('updateTopMenu', {statusText});
    }
}

export default updateStatus;
