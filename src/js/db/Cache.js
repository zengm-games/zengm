// @flow

import backboard from 'backboard';
import Promise from 'bluebird';
import g from '../globals';
import type {BackboardTx} from '../util/types';

type Status = 'empty' | 'error' | 'filling' | 'flushing' | 'full';

// Only these IDB object stores for now. Keep in memory only player info for non-retired players and team info for the current season.
type Store = 'playerStats' | 'players' | 'teamSeasons' | 'teamStats' | 'teams';
type Index = 'playerStats' | 'playerStatsByPid' | 'playersByTid' | 'teamSeasonsBySeasonTid' | 'teamSeasonsByTidSeason';

type Data = {
    [key: Store]: any,
};
type Indexes = {
    [key: Index]: any,
};

const STORES: Store[] = ['playerStats', 'players', 'teamSeasons', 'teamStats', 'teams'];

class Cache {
    data: Data;
    indexes: Indexes;
    status: Status;

    constructor() {
        this.status = 'empty';
        this.data = {};
        this.indexes = {};
    }

    checkStatus(...validStatuses: Status[]) {
        if (!validStatuses.includes(this.status)) {
            throw new Error(`Invalid cache status "${this.status}"`);
        }
    }

    setStatus(status: Status) {
        this.status = status;
    }

    async fillPlayers(tx: BackboardTx) {
        this.checkStatus('filling');

        const [players1, players2] = await Promise.all([
            tx.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.UNDRAFTED)),
            tx.players.index('tid').getAll(backboard.bound(g.PLAYER.UNDRAFTED_FANTASY_TEMP, g.PLAYER.UNDRAFTED_2)),
        ]);

        this.data.players = {};
        this.indexes.playersByTid = {};

        const promises = [];

        for (const p of players1.concat(players2)) {
            this.data.players[p.pid] = p;

            if (!this.indexes.playersByTid.hasOwnProperty(p.tid)) {
                this.indexes.playersByTid[p.tid] = [];
            }
            this.indexes.playersByTid[p.tid].push(p);

            promises.push(
                tx.playerStats.index('pid, season, tid')
                    .getAll(backboard.bound([p.pid, g.season], [p.pid, g.season, ''])),
            );
        }

        this.data.playerStats = {};
        this.indexes.playerStatsByPid = {};

        // Only save latest stats row for each player (so playoff stats if available, and latest team if traded mid-season)
        const resolvedPromises = await Promise.all(promises);
        for (const psRows of resolvedPromises) {
            for (const ps of psRows) {
                let latest = false;
                if (!this.indexes.playerStatsByPid.hasOwnProperty(ps.pid)) {
                    this.indexes.playerStatsByPid[ps.pid] = ps;
                    latest = true;
                } else if (ps.psid > this.indexes.playerStatsByPid[ps.pid].psid) {
                    this.indexes.playerStatsByPid[ps.pid] = ps;
                    latest = true;
                }

                if (latest) {
//                    this.data.playerStats[ps.psid] = ps;
                }
            }
        }
    }

    // Past 3 seasons
    async fillTeamSeasons(tx: BackboardTx) {
        this.checkStatus('filling');

        const teamSeasons = await tx.teamSeasons.index('season, tid').getAll(backboard.bound([g.season - 2], [g.season, '']));

        this.data.teamSeasons = {};
        this.indexes.teamSeasonsBySeasonTid = {};
        this.indexes.teamSeasonsByTidSeason = {};

        for (const ts of teamSeasons) {
//            this.data.teamSeasons[ts.rid] = ts;
            this.indexes.teamSeasonsBySeasonTid[`${ts.season},${ts.tid}`] = ts;
            this.indexes.teamSeasonsByTidSeason[`${ts.tid},${ts.season}`] = ts;
        }
    }

    async fillTeams(tx: BackboardTx) {
        this.checkStatus('filling');

        const teams = await tx.teams.getAll();

        this.data.teams = {};

        for (const t of teams) {
            this.data.teams[t.tid] = t;
        }
    }

    // Load database from disk and save in cache, wiping out any prior values in cache
    async fill() {
        this.checkStatus('empty', 'full');
        this.setStatus('filling');

        this.data = {};

        await g.dbl.tx(STORES, async (tx) => {
            const promises = [
                this.fillPlayers(tx),
                this.fillTeamSeasons(tx),
                this.fillTeams(tx),
            ];

            await Promise.all(promises);
        });

        this.setStatus('full');
    }

    // Take current contents in database and write to disk
    async flush() {
        this.checkStatus('full');
        this.setStatus('flushing');

        this.setStatus('empty');
    }

    async get(store: Store, id: number) {
        this.checkStatus('full');

        return this.data[store][id];
    }

    async getAll(store: Store) {
        this.checkStatus('full');

        return Object.values(this.data[store]);
    }

    async indexGet(index: Index, key: number) {
        this.checkStatus('full');

        const val = this.indexes[index][key];

        if (Array.isArray(val)) {
            return val[0];
        }
        return val;
    }

    async indexGetAll(index: Index, key: number | [number, number]) {
        this.checkStatus('full');

        if (typeof key === 'number' || typeof key === 'string') {
            return this.indexes[index][key];
        }

        const [min, max] = key;
        let output = [];
        for (const i of Object.keys(this.indexes[index])) {
            if (i >= min && i <= max) {
                output = output.concat(this.indexes[index][i]);
            }
        }
        return output;
    }
}

export default Cache;
