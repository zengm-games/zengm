// @flow

import {g} from '../../common';
import {league} from '../core';
import {toUI} from '../util';

/*Save status to database and push to client.

If no status is given, load the last status from the database and push that
to the client.

Args:
    status: A string containing the current status message to be pushed to
        the client.
*/
async function updateStatus(statusText?: string) {
    // $FlowFixMe
    if (typeof it === 'function') { return; }
    const oldStatus = g.statusText;
    if (statusText === undefined) {
        toUI('emit', 'updateTopMenu', {statusText: oldStatus});
    } else if (statusText !== oldStatus) {
        await league.setGameAttributes({statusText});
        toUI('emit', 'updateTopMenu', {statusText});
    }
}

export default updateStatus;
