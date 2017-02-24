// @flow

import Promise from 'bluebird';
import g from '../globals';
import {init, views} from '../worker';
import {league} from '../worker/core';
import type {GetOutput, UpdateEvents} from '../util/types';

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

const removeLeague = async (lid: number) => {
    await league.remove(lid);
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
    init,
    clearWatchList,
    removeLeague,
    runBefore,
    updatePlayerWatch,
    updateUserTid,
};
