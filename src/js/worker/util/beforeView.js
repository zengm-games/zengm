// @flow

import {Cache, connectLeague, idb} from '../db';
import {g, helpers} from '../../common';
import {league} from '../core';
import {toUI, updatePhase, updatePlayMenu, updateStatus} from '../util';

const beforeLeague = async (newLid: number, loadedLid: ?number) => {
    g.lid = newLid;

    // Make sure league template FOR THE CURRENT LEAGUE is showing
    if (loadedLid !== g.lid) {
        // Clear old game attributes from g, just to be sure
        helpers.resetG();
        await toUI('resetG');

        // Make sure this league exists before proceeding
        const l = await idb.meta.leagues.get(g.lid);
        if (l === undefined) {
            throw new Error('League not found.');
        }

        idb.league = await connectLeague(g.lid);

        // Reuse existing cache, if it was just created for a new league
        if (!idb.cache || !idb.cache.newLeague) {
            idb.cache = new Cache();
            await idb.cache.fill();
        } else if (idb.cache && idb.cache.newLeague) {
            idb.cache.newLeague = false;
        }

        await league.loadGameAttributes();

        // Update play menu
        await updateStatus();
        await updatePhase();
        await updatePlayMenu();
        toUI('emit', 'updateTopMenu', {lid: g.lid});
    }
};

const beforeNonLeague = () => {
    g.lid = undefined;
    toUI('emit', 'updateTopMenu', {lid: undefined});
};

export default {
    league: beforeLeague,
    nonLeague: beforeNonLeague,
};
