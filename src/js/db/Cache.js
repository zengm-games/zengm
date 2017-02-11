// @flow

import backboard from 'backboard';
import Promise from 'bluebird';
import orderBy from 'lodash.orderby';
import g from '../globals';
import type {BackboardTx, PlayerStats} from '../util/types';

type Status = 'empty' | 'error' | 'filling' | 'flushing' | 'full';

// Only these IDB object stores for now. Keep in memory only player info for non-retired players and team info for the current season.
type Store = 'games' | 'playerFeats' | 'playerStats' | 'players' | 'releasedPlayers' | 'schedule' | 'teamSeasons' | 'teamStats' | 'teams';
type Index = 'playerStats' | 'playerStatsAllByPid' | 'playerStatsByPid' | 'playersByTid' | 'releasedPlayers' | 'releasedPlayersByTid' | 'teamSeasonsBySeasonTid' | 'teamSeasonsByTidSeason' | 'teamStatsByPlayoffsTid';

type Data = {
    [key: Store]: any,
};
type Deletes = {
    [key: Store]: number[],
};
type Indexes = {
    [key: Index]: any,
};
type MaxIds = {
    [key: Index]: number,
};

const STORES: Store[] = ['games', 'playerFeats', 'playerStats', 'players', 'releasedPlayers', 'schedule', 'teamSeasons', 'teamStats', 'teams'];

class Cache {
    data: Data;
    deletes: Deletes;
    indexes: Indexes;
    maxIds: MaxIds;
    status: Status;

    constructor() {
        this.status = 'empty';

        this.data = {};
        this.deletes = {};
        this.indexes = {};
        this.maxIds = {};
    }

    checkStatus(...validStatuses: Status[]) {
        if (!validStatuses.includes(this.status)) {
            throw new Error(`Invalid cache status "${this.status}"`);
        }
    }

    setStatus(status: Status) {
        this.status = status;
    }

    // Current season
    async fillGames(tx: BackboardTx) {
        this.checkStatus('filling');

        const games = await tx.games.index('season').getAll(g.season);

        this.data.games = {};

        for (const gm of games) {
            this.data.games[gm.gid] = gm;
        }
    }

    // Non-retired players
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
                    .getAll(backboard.bound([p.pid, g.season - 1], [p.pid, g.season, ''])),
            );
        }

        this.data.playerStats = {};
        this.indexes.playerStatsByPid = {};
        this.indexes.playerStatsAllByPid = {};

        const resolvedPromises = await Promise.all(promises);
        for (const psRows of resolvedPromises) {
            for (const ps of orderBy(psRows, 'psid')) {
                // Only save latest stats row for each player (so playoff stats if available, and latest team if traded mid-season)
                if (ps.season === g.season) {
                    this.indexes.playerStatsByPid[ps.pid] = ps;
                }

                // Save all regular season entries, for player.value and player.addStatsRow
                if (!ps.playoffs) {
                    if (!this.indexes.playerStatsAllByPid.hasOwnProperty(ps.pid)) {
                        this.indexes.playerStatsAllByPid[ps.pid] = [ps];
                    } else {
                        this.indexes.playerStatsAllByPid[ps.pid].unshift(ps);
                    }
                }

                this.data.playerStats[ps.psid] = ps;
            }
        }

        this.maxIds.playerStats = -1;
        await tx.playerStats.iterate(null, 'prev', (ps: PlayerStats, shortCircuit) => {
            if (ps) {
                this.maxIds.playerStats = ps.psid;
            }
            shortCircuit();
        });

        this.data.playerFeats = {};
    }

    async fillReleasedPlayers(tx: BackboardTx) {
        this.checkStatus('filling');

        const releasedPlayers = await tx.releasedPlayers.getAll();

        this.data.releasedPlayers = {};
        this.indexes.releasedPlayersByTid = {};

        for (const rp of releasedPlayers) {
            this.data.releasedPlayers[rp.rid] = rp;

            if (!this.indexes.releasedPlayersByTid.hasOwnProperty(rp.tid)) {
                this.indexes.releasedPlayersByTid[rp.tid] = [];
            }
            this.indexes.releasedPlayersByTid[rp.tid].push(rp);
        }
    }

    async fillSchedule(tx: BackboardTx) {
        this.checkStatus('filling');

        const schedule = await tx.schedule.getAll();

        this.data.schedule = {};
        this.deletes.schedule = [];

        for (const s of schedule) {
            this.data.schedule[s.gid] = s;
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

    // Current season
    async fillTeamStats(tx: BackboardTx) {
        this.checkStatus('filling');

        const teamStats = await tx.teamStats.index('season, tid').getAll(backboard.bound([g.season], [g.season, '']));

        this.data.teamStats = {};
        this.indexes.teamStatsByPlayoffsTid = {};

        for (const ts of teamStats) {
//            this.data.teamStats[ts.rid] = ts;
            this.indexes.teamStatsByPlayoffsTid[`${ts.playoffs ? 1 : 0},${ts.tid}`] = ts;
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
            await Promise.all([
                this.fillGames(tx),
                this.fillPlayers(tx),
                this.fillReleasedPlayers(tx),
                this.fillSchedule(tx),
                this.fillTeamSeasons(tx),
                this.fillTeamStats(tx),
                this.fillTeams(tx),
            ]);
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

    async indexGet(index: Index, key: number | string) {
        this.checkStatus('full');

        const val = this.indexes[index][key];

        if (Array.isArray(val)) {
            return val[0];
        }
        return val;
    }

    async indexGetAll(index: Index, key: number | string | [number, number] | [string, string]) {
        this.checkStatus('full');

        if (typeof key === 'number' || typeof key === 'string') {
            if (this.indexes[index].hasOwnProperty(key)) {
                return this.indexes[index][key];
            }
            return [];
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

    async add(store: Store, obj: any) {
        if (store === 'games') {
            if (this.data.games[obj.gid]) {
                throw new Error(`Primary key ${obj.gid} already exists in games`);
            }
            this.data.games[obj.gid] = obj;
        } else if (store === 'playerFeats') {
            // Don't know primary key, and don't care
            let key = Math.min(...Object.keys(this.data.playerFeats));
            if (key === -Infinity) {
                key = 0;
            }
            this.data.playerFeats[key] = obj;
        } else if (store === 'playerStats') {
            if (obj.hasOwnProperty('psid')) {
                if (this.data.playerStats[obj.psid]) {
                    throw new Error(`Primary key ${obj.psid} already exists in playerStats`);
                }
            } else {
                this.maxIds.playerStats += 1;
                obj.psid = this.maxIds.playerStats;
            }

            this.data.playerStats[obj.psid] = obj;

            if (obj.season === g.season) {
                this.indexes.playerStatsByPid[obj.pid] = obj;
            }

            if (!obj.playoffs) {
                if (!this.indexes.playerStatsAllByPid.hasOwnProperty(obj.pid)) {
                    this.indexes.playerStatsAllByPid[obj.pid] = [obj];
                } else {
                    this.indexes.playerStatsAllByPid[obj.pid].unshift(obj);
                }
            }
        } else if (store === 'schedule') {
            if (this.data.schedule[obj.gid]) {
                throw new Error(`Primary key ${obj.gid} already exists in schedule`);
            }
            this.data.schedule[obj.gid] = obj;
        } else {
            throw new Error(`put not implemented for store "${store}"`);
        }
    }

    async delete(store: Store, key: number) {
        if (store === 'schedule') {
            if (this.data.schedule.hasOwnProperty(key)) {
                delete this.data.schedule[key];
                this.deletes.schedule.push(key);
            } else {
                throw new Error(`Invalid key to delete from "schedule" store: ${key}`);
            }
        } else {
            throw new Error(`delete not implemented for store "${store}"`);
        }
    }

    async clear(store: Store) {
        if (store === 'schedule') {
            for (const gid of Object.keys(this.data.schedule)) {
                delete this.data.schedule[gid];
                this.deletes.schedule.push(gid);
            }
        } else {
            throw new Error(`clear not implemented for store "${store}"`);
        }
    }
}

export default Cache;
