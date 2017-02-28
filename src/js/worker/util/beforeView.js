// @flow

import React from 'react';
import {Cache, connectLeague, idb} from '../db';
import {g} from '../../common';
import * as api from '../api';
import {league} from '../core';
import {updatePhase, updatePlayMenu, updateStatus} from '../util';
import * as helpers from '../../util/helpers';
import type {PageCtx, UpdateEvents} from '../../common/types';

const beforeLeague = async (ctx: PageCtx, loadedLid: ?number): Promise<[UpdateEvents, () => void, ?string]> => {
    g.lid = parseInt(ctx.params.lid, 10);

    // Check for some other window making changes to the database
    const checkDbChange = async lid => {
        // Stop if the league isn't viewed anymore
        if (lid !== g.lid) {
            return;
        }

        // league.loadGameAttribute cannot be used to check for a new lastDbChange because we need to have the old g.lastDbChange available right up to the last moment possible, for cases where league.loadGameAttribute might be blocked during a slow page refresh, as happens when viewing player rating and stat distributions. Otherwise, an extra refresh would occur with a stale lastDbChange.

        const lastDbChange = await idb.league.gameAttributes.get("lastDbChange");
        if (g.lastDbChange !== lastDbChange.value) {
            await league.loadGameAttributes();
            //leagueContentEl.innerHTML = "&nbsp;";  // Blank doesn't work, for some reason
            api.realtimeUpdate(["dbChange"], undefined, async () => {
                await updatePlayMenu();
                updatePhase();
                updateStatus();
                setTimeout(() => checkDbChange(lid), 3000);
            });
        } else {
            setTimeout(() => checkDbChange(lid), 3000);
        }
    };

    // Make sure league exists

    // Handle some common internal parameters
    const updateEvents = ctx.bbgm.updateEvents !== undefined ? ctx.bbgm.updateEvents : [];
    const ctxCb = ctx.bbgm.cb !== undefined ? ctx.bbgm.cb : () => {};

    // Make sure league template FOR THE CURRENT LEAGUE is showing
    if (loadedLid !== g.lid) {
        // Clear old game attributes from g, to make sure the new ones are saved to the db in league.setGameAttributes
        helpers.resetG();

        // Make sure this league exists before proceeding
        const l = await idb.meta.leagues.get(g.lid);
        if (l === undefined) {
            helpers.error(<span>League not found. <a href="/new_league">Create a new league</a> or <a href="/">load an existing league</a> to play!</span>, ctxCb, true);
            return [[], () => {}, 'abort'];
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
        updateStatus();
        updatePhase();
        await updatePlayMenu();
        api.emit('updateTopMenu', {lid: g.lid});
        //checkDbChange(g.lid); // Currently not working
        return [updateEvents, ctxCb, undefined];
    }

    return [updateEvents, ctxCb, undefined];
};

const beforeNonLeague = (ctx: PageCtx): [UpdateEvents, () => void, ?string] => {
    g.lid = undefined;
    api.emit('updateTopMenu', {lid: undefined});

    const updateEvents = (ctx !== undefined && ctx.bbgm.updateEvents !== undefined) ? ctx.bbgm.updateEvents : [];
    const ctxCb = (ctx !== undefined && ctx.bbgm.cb !== undefined) ? ctx.bbgm.cb : () => {};
    return [updateEvents, ctxCb, undefined];
};

export default {
    league: beforeLeague,
    nonLeague: beforeNonLeague,
};
