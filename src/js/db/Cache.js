// @flow

import backboard from 'backboard';
import Promise from 'bluebird';
import g from '../globals';
import type {BackboardTx} from '../util/types';

type Status = 'empty' | 'error' | 'filling' | 'flushing' | 'full';

// Only these IDB object stores for now. Keep in memory only player info for non-retired players and team info for the current season.
type Store = 'players' | 'playerStats' | 'teams' | 'teamSeasons' | 'teamStats';

type Data = {
    [key: Store]: any,
};

const STORES: Store[] = ['players', 'playerStats', 'teams', 'teamSeasons', 'teamStats'];

class Cache {
    data: Data;
    status: Status;

    constructor() {
        this.status = 'empty';
        this.data = {};
    }

    checkStatus(...validStatuses: Status[]) {
        if (!validStatuses.includes(this.status)) {
            throw new Error(`Invalid cache status "${this.status}"`);
        }
    }

    async fillPlayers(tx: BackboardTx) {
        this.checkStatus('filling');

        const players1 = await tx.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.UNDRAFTED));
        const players2 = await tx.players.index('tid').getAll(backboard.bound(g.PLAYER.UNDRAFTED_FANTASY_TEMP, g.PLAYER.UNDRAFTED_2));

        this.data.players = {};

        const promises = [];

        for (const p of players1.concat(players2)) {
            this.data.players[p.pid] = p;

            promises.push(
                tx.playerStats.index('pid, season, tid')
                    .getAll(backboard.bound([p.pid, g.season], [p.pid, g.season, ''])),
            );
        }

        this.data.playerStats = {};
        for (const psRows of await Promise.all(promises)) {
            for (const ps of psRows) {
                this.data.playerStats[ps.psid] = ps;
            }
        }
    }

    // Load database from disk and save in cache, wiping out any prior values in cache
    async fill() {
        this.checkStatus('empty', 'full');
        this.status = 'filling';

        this.data = {};

        await g.dbl.tx(STORES, async (tx) => {
            const promises = [
                this.fillPlayers(tx),
            ];

            await Promise.all(promises);
        });

        this.status = 'full';
    }

    // Take current contents in database and write to disk
    async flush() {
        this.checkStatus('full');
        this.status = 'flushing';
    }

    async get(store: Store, id: number | string) {
        this.checkStatus('full');

        console.log('get', store, id);
    }

    async getAll(store: Store, min: number | string, max: number | string) {
        this.checkStatus('full');

        console.log('getAll', store, min, max);
    }
}

export default Cache;
