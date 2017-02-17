// @flow

import React from 'react';
import {Cache, connectLeague} from '../db';
import g from '../globals';
import * as ui from '../ui';
import * as league from '../core/league';
import * as helpers from './helpers';
import type {PageCtx, UpdateEvents} from './types';

const beforeLeague = async (ctx: PageCtx, loadedLid: ?number): Promise<[UpdateEvents, () => void, ?string]> => {
    g.lid = parseInt(ctx.params.lid, 10);

    // Check for some other window making changes to the database
    const checkDbChange = async lid => {
        // Stop if the league isn't viewed anymore
        if (lid !== g.lid) {
            return;
        }

        // league.loadGameAttribute cannot be used to check for a new lastDbChange because we need to have the old g.lastDbChange available right up to the last moment possible, for cases where league.loadGameAttribute might be blocked during a slow page refresh, as happens when viewing player rating and stat distributions. Otherwise, an extra refresh would occur with a stale lastDbChange.

        const lastDbChange = await g.dbl.gameAttributes.get("lastDbChange");
        if (g.lastDbChange !== lastDbChange.value) {
            await league.loadGameAttributes();
            //leagueContentEl.innerHTML = "&nbsp;";  // Blank doesn't work, for some reason
            ui.realtimeUpdate(["dbChange"], undefined, async () => {
                await ui.updatePlayMenu(null);
                ui.updatePhase();
                ui.updateStatus();
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
        const l = await g.dbm.leagues.get(g.lid);
        if (l === undefined) {
            helpers.error(<span>League not found. <a href="/new_league">Create a new league</a> or <a href="/">load an existing league</a> to play!</span>, ctxCb, true);
            return [[], () => {}, 'abort'];
        }

        await connectLeague(g.lid);
        g.cache = new Cache();
        await g.cache.fill();
        await league.loadGameAttributes();

        // Update play menu
        ui.updateStatus();
        ui.updatePhase();
        await ui.updatePlayMenu(null);
        g.emitter.emit('updateTopMenu', {lid: g.lid});
        //checkDbChange(g.lid); // Currently not working
        return [updateEvents, ctxCb, undefined];
    }

    return [updateEvents, ctxCb, undefined];
};

const beforeNonLeague = (ctx: PageCtx): [UpdateEvents, () => void, ?string] => {
    g.lid = null;
    g.emitter.emit('updateTopMenu', {lid: undefined});

    const updateEvents = (ctx !== undefined && ctx.bbgm.updateEvents !== undefined) ? ctx.bbgm.updateEvents : [];
    const ctxCb = (ctx !== undefined && ctx.bbgm.cb !== undefined) ? ctx.bbgm.cb : () => {};
    return [updateEvents, ctxCb, undefined];
};

export {
    beforeLeague,
    beforeNonLeague,
};
