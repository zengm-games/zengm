// @flow

import {g} from '../../common';
import {league} from '../core';
import {idb} from '../db';
import {toUI} from '../util';

/*Save phase text to database and push to client.

If no phase text is given, load the last phase text from the database and
push that to the client.

Args:
    phaseText: A string containing the current phase text to be pushed to
        the client.
*/
async function updatePhase(phaseText?: string) {
    // $FlowFixMe
    if (typeof it === 'function') { return; }
    const oldPhaseText = g.phaseText;
    if (phaseText === undefined) {
        toUI('emit', 'updateTopMenu', {phaseText: oldPhaseText});
    } else if (phaseText !== oldPhaseText) {
        await league.setGameAttributes({phaseText});
        toUI('emit', 'updateTopMenu', {phaseText});

        // Update phase in meta database. No need to have this block updating the UI or anything.
        (async () => {
            const l = await idb.meta.leagues.get(g.lid);
            l.phaseText = phaseText;
            await idb.meta.leagues.put(l);
        })();
    }
}

export default updatePhase;
