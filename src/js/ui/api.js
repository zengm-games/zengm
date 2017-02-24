// @flow

import Promise from 'bluebird';
import g from '../globals';
import {init, views} from '../worker';
import {league} from '../worker/core';
import type {GetOutput, UpdateEvents} from '../util/types';

const clearWatchList = async () => {
    const players = await g.cache.getAll('players');
    for (const p of players) {
        if (p.watch) {
            p.watch = false;
        }
    }

    await g.dbl.tx("players", "readwrite", tx => {
        return tx.players.iterate(p => {
            if (p.watch) {
                p.watch = false;
                return p;
            }
        });
    });

    league.updateLastDbChange();
};

const createLeague = async (
    name: string,
    tid: number,
    leagueFile: Object = {},
    startingSeason: number,
    randomizeRosters: boolean,
): number => {
    return league.create(name, tid, leagueFile, startingSeason, randomizeRosters);
};

const removeLeague = async (lid: number) => {
    await league.remove(lid);
};

const runBefore = async (
    viewId: string,
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    prevData: any,
    setStateData: (state: any) => void,
    topMenu: any,
): Promise<(void | {[key: string]: any})[]> => {
    if (views.hasOwnProperty(viewId) && views[viewId].hasOwnProperty('runBefore')) {
        return Promise.all(views[viewId].runBefore.map((fn) => {
            return fn(inputs, updateEvents, prevData, setStateData, topMenu);
        }));
    }

    return [];
};

const switchTeam = async (tid: number) => {
    await league.setGameAttributes({
        gameOver: false,
        userTid: tid,
        userTids: [tid],
        ownerMood: {
            wins: 0,
            playoffs: 0,
            money: 0,
        },
        gracePeriodEnd: g.season + 3, // +3 is the same as +2 when staring a new league, since this happens at the end of a season
    });

    league.updateLastDbChange();
    league.updateMetaNameRegion(g.teamNamesCache[g.userTid], g.teamRegionsCache[g.userTid]);
};

const updatePlayerWatch = async (pid: number, watch: boolean) => {
    const cachedPlayer = await g.cache.get('players', pid);
    if (cachedPlayer) {
        cachedPlayer.watch = watch;
    } else {
        await g.dbl.tx('players', 'readwrite', async tx => {
            const p = await tx.players.get(pid);
            p.watch = watch;
            await tx.players.put(p);
        });
    }

    league.updateLastDbChange();
};

const updateUserTid = async (userTid: number) => {
    await league.setGameAttributes({
        userTid,
    });
    g.emitter.emit('updateMultiTeam');

    league.updateLastDbChange();
};

export {
    createLeague,
    init,
    clearWatchList,
    removeLeague,
    runBefore,
    switchTeam,
    updatePlayerWatch,
    updateUserTid,
};
