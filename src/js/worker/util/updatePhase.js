// @flow

import g from '../../globals';
import {league} from '../core';

/*Save phase text to database and push to client.

If no phase text is given, load the last phase text from the database and
push that to the client.

Args:
    phaseText: A string containing the current phase text to be pushed to
        the client.
*/
async function updatePhase(phaseText?: string) {
    const oldPhaseText = g.phaseText;
    if (phaseText === undefined) {
        g.emitter.emit('updateTopMenu', {phaseText: oldPhaseText});
    } else if (phaseText !== oldPhaseText) {
        await league.setGameAttributes({phaseText});
        g.emitter.emit('updateTopMenu', {phaseText});

        // Update phase in meta database. No need to have this block updating the UI or anything.
        (async () => {
            const l = await g.dbm.leagues.get(g.lid);
            l.phaseText = phaseText;
            await g.dbm.leagues.put(l);
        })();
    }
}

export default updatePhase;
