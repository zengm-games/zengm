// @flow

import backboard from 'backboard';
import Promise from 'bluebird';
import orderBy from 'lodash.orderby';
import g from '../globals';
import type {BackboardTx, Player, PlayerStats} from '../util/types';

type Status = 'empty' | 'error' | 'filling' | 'flushing' | 'full';

// Only these IDB object stores for now. Keep in memory only player info for non-retired players and team info for the current season.
type Store = 'games' | 'playerFeats' | 'playerStats' | 'players' | 'releasedPlayers' | 'schedule' | 'teamSeasons' | 'teamStats' | 'teams';
type Index = 'playerStats' | 'playerStatsAllByPid' | 'playerStatsByPid' | 'playersByTid' | 'releasedPlayers' | 'releasedPlayersByTid' | 'teamSeasonsBySeasonTid' | 'teamSeasonsByTidSeason' | 'teamStatsByPlayoffsTid';

// This variable is only needed because Object.keys(storeInfos) is not handled well in Flow
const STORES: Store[] = ['games', 'playerFeats', 'playerStats', 'players', 'releasedPlayers', 'schedule', 'teamSeasons', 'teamStats', 'teams'];

const storeInfos: {
    [key: Store]: {
        pk: string,
        getData: (BackboardTx, Player[]) => Promise<any[]>,
        indexes?: {
            name: Index,
            filter?: (any) => boolean,
            key: (any) => string,
            unique?: boolean,
        }[],
    },
} = {
    games: {
        pk: 'gid',

        // Current season
        getData: (tx: BackboardTx) => tx.games.index('season').getAll(g.season),
    },
    playerFeats: {
        pk: 'fid',

        // No need to store any in cache except new ones
        getData: () => [],
    },
    playerStats: {
        pk: 'psid',

        getData: async (tx: BackboardTx, players: Player[]) => {
            const psNested = await Promise.all(players.map((p) => {
                return tx.playerStats
                    .index('pid, season, tid')
                    .getAll(backboard.bound([p.pid, g.season - 1], [p.pid, g.season, '']));
            }));

            // Flatten
            const psRows = [].concat(...psNested);

            return orderBy(psRows, 'psid');
        },

        indexes: [{
            // Only save latest stats row for each player (so playoff stats if available, and latest team if traded mid-season)
            name: 'playerStatsByPid',
            filter: (row) => row.season === g.season,
            key: (row) => String(row.pid),
            unique: true,
        }, {
            name: 'playerStatsAllByPid',
            filter: (row) => !row.playoffs,
            key: (row) => String(row.pid),
        }],
    },
    players: {
        pk: 'pid',
        getData: (tx: BackboardTx, players: Player[]) => players,
        indexes: [{
            name: 'playersByTid',
            key: (row) => String(row.tid),
        }],
    },
    releasedPlayers: {
        pk: 'rid',
        getData: (tx: BackboardTx) => tx.releasedPlayers.getAll(),
        indexes: [{
            name: 'releasedPlayersByTid',
            key: (row) => String(row.tid),
        }],
    },
    schedule: {
        pk: 'gid',
        getData: (tx: BackboardTx) => tx.schedule.getAll(),
    },
    teamSeasons: {
        pk: 'rid',

        // Past 3 seasons
        getData: (tx: BackboardTx) => {
            return tx.teamSeasons
                .index('season, tid')
                .getAll(backboard.bound([g.season - 2], [g.season, '']));
        },

        indexes: [{
            name: 'teamSeasonsBySeasonTid',
            key: (row) => `${row.season},${row.tid}`,
            unique: true,
        }, {
            name: 'teamSeasonsByTidSeason',
            key: (row) => `${row.tid},${row.season}`,
            unique: true,
        }],
    },
    teamStats: {
        pk: 'rid',

        // Current season
        getData: (tx: BackboardTx) => {
            return tx.teamStats
                .index('season, tid')
                .getAll(backboard.bound([g.season], [g.season, '']));
        },

        indexes: [{
            name: 'teamStatsByPlayoffsTid',
            key: (row) => `${row.playoffs ? 1 : 0},${row.tid}`,
            unique: true,
        }],
    },
    teams: {
        pk: 'tid',
        getData: (tx: BackboardTx) => tx.teams.getAll(),
    },
};

class Cache {
    data: {[key: Store]: any};
    deletes: {[key: Store]: Set<number>};
    indexes: {[key: Index]: any};
    maxIds: {[key: Store]: number};
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

    // Load database from disk and save in cache, wiping out any prior values in cache
    async fill() {
        this.checkStatus('empty', 'full');
        this.setStatus('filling');

        this.data = {};

        await g.dbl.tx(STORES, async (tx) => {
            // Non-retired players - this is special because it's used for players and playerStats
            const [players1, players2] = await Promise.all([
                tx.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.UNDRAFTED)),
                tx.players.index('tid').getAll(backboard.bound(g.PLAYER.UNDRAFTED_FANTASY_TEMP, g.PLAYER.UNDRAFTED_2)),
            ]);

            const players = players1.concat(players2);

            await Promise.all(STORES.map(async (store) => {
                const storeInfo = storeInfos[store];
                const data = await storeInfo.getData(tx, players);

                this.data[store] = {};
                for (const row of data) {
                    const key = row[storeInfo.pk];
                    this.data[store][key] = row;
                }

                this.deletes[store] = new Set();

                if (storeInfo.indexes) {
                    for (const index of storeInfo.indexes) {
                        this.indexes[index.name] = {};
                        for (const row of data) {
                            if (index.filter && !index.filter(row)) {
                                continue;
                            }

                            const key = index.key(row);

                            if (!index.unique) {
                                if (!this.indexes[index.name].hasOwnProperty(key)) {
                                    this.indexes[index.name][key] = [row];
                                } else {
                                    this.indexes[index.name][key].push(row);
                                }
                            } else {
                                this.indexes[index.name][key] = row;
                            }
                        }
                    }
                }
            }).concat(STORES.map(async (store) => {
                const pk = storeInfos[store].pk;
                this.maxIds[store] = -1;
                await tx[store].iterate(null, 'prev', (row, shortCircuit) => {
                    if (row) {
                        this.maxIds[store] = row[pk];
                    }
                    shortCircuit();
                });
            })));
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
        this.checkStatus('full');

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
                    this.indexes.playerStatsAllByPid[obj.pid].push(obj);
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
        this.checkStatus('full');

        if (store === 'schedule') {
            if (this.data[store].hasOwnProperty(key)) {
                delete this.data[store][key];
                this.deletes[store].add(key);
            } else {
                throw new Error(`Invalid key to delete from store "${store}": ${key}`);
            }
        } else {
            throw new Error(`delete not implemented for store "${store}"`);
        }
    }

    async clear(store: Store) {
        this.checkStatus('full');

        if (store === 'schedule') {
            for (const key of Object.keys(this.data[store])) {
                delete this.data[store][storeInfos[store].pk];
                this.deletes[store].add(key);
            }
        } else {
            throw new Error(`clear not implemented for store "${store}"`);
        }
    }
}

export default Cache;
