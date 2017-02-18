// @flow

import backboard from 'backboard';
import Promise from 'bluebird';
import orderBy from 'lodash.orderby';
import g from '../globals';
import type {BackboardTx, Player} from '../util/types';

type Status = 'empty' | 'error' | 'filling' | 'flushing' | 'full';

// Only these IDB object stores for now. Keep in memory only player info for non-retired players and team info for the current season.
type Store = 'awards' | 'events' | 'gameAttributes' | 'games' | 'messages' | 'negotiations' | 'playerFeats' | 'playerStats' | 'players' | 'releasedPlayers' | 'schedule' | 'teamSeasons' | 'teamStats' | 'teams' | 'trade';
type Index = 'playerStats' | 'playerStatsAllByPid' | 'playerStatsByPid' | 'playersByTid' | 'releasedPlayers' | 'releasedPlayersByTid' | 'teamSeasonsBySeasonTid' | 'teamSeasonsByTidSeason' | 'teamStatsByPlayoffsTid';

// This variable is only needed because Object.keys(storeInfos) is not handled well in Flow
const STORES: Store[] = ['awards', 'events', 'gameAttributes', 'games', 'messages', 'negotiations', 'playerFeats', 'playerStats', 'players', 'releasedPlayers', 'schedule', 'teamSeasons', 'teamStats', 'teams', 'trade'];

class Cache {
    data: {[key: Store]: any};
    deletes: {[key: Store]: Set<number>};
    indexes: {[key: Index]: any};
    maxIds: {[key: Store]: number};
    status: Status;
    storeInfos: {
        [key: Store]: {
            pk: string,
            getData?: (BackboardTx, Player[]) => Promise<any[]>,
            indexes?: {
                name: Index,
                filter?: (any) => boolean,
                key: (any) => string,
                unique?: boolean,
            }[],
        },
    };
    season: number;

    constructor() {
        this.status = 'empty';

        this.data = {};
        this.deletes = {};
        this.indexes = {};
        this.maxIds = {};

        this.storeInfos = {
            awards: {
                pk: 'season',
            },
            events: {
                pk: 'eid',
            },
            gameAttributes: {
                pk: 'key',

                getData: (tx: BackboardTx) => tx.gameAttributes.getAll(),
            },
            games: {
                pk: 'gid',

                // Current season
                getData: (tx: BackboardTx) => tx.games.index('season').getAll(this.season),
            },
            messages: {
                pk: 'mid',
            },
            negotiations: {
                pk: 'pid',
                getData: (tx: BackboardTx) => tx.negotiations.getAll(),
            },
            playerFeats: {
                pk: 'fid',
            },
            playerStats: {
                pk: 'psid',

                getData: async (tx: BackboardTx, players: Player[]) => {
                    const psNested = await Promise.all(players.map((p) => {
                        return tx.playerStats
                            .index('pid, season, tid')
                            .getAll(backboard.bound([p.pid, this.season - 1], [p.pid, this.season, '']));
                    }));

                    // Flatten
                    const psRows = [].concat(...psNested);

                    return orderBy(psRows, 'psid');
                },

                indexes: [{
                    // Only save latest stats row for each player (so playoff stats if available, and latest team if traded mid-season)
                    name: 'playerStatsByPid',
                    filter: (row) => row.season === this.season,
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
                        .getAll(backboard.bound([this.season - 2], [this.season, '']));
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
                        .getAll(backboard.bound([this.season], [this.season, '']));
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
            trade: {
                pk: 'rid',
                getData: (tx: BackboardTx) => tx.trade.getAll(),
            },
        };
    }

    checkStatus(...validStatuses: Status[]) {
        if (!validStatuses.includes(this.status)) {
            throw new Error(`Invalid cache status "${this.status}"`);
        }
    }

    setStatus(status: Status) {
        this.status = status;
    }

    async loadStore(store: Store, tx: BackboardTx, players: Player[]) {
        const storeInfo = this.storeInfos[store];

        // Load data and do maxIds calculation in parallel
        await Promise.all([
            (async () => {
                // No getData implies no need to store any records in cache except new ones
                const data = storeInfo.getData ? await storeInfo.getData(tx, players) : [];

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
            })(),
            (async () => {
                this.maxIds[store] = -1;
                await tx[store].iterate(null, 'prev', (row, shortCircuit) => {
                    if (row) {
                        this.maxIds[store] = row[storeInfo.pk];
                    }
                    shortCircuit();
                });
            })(),
        ]);
    }

    // Load database from disk and save in cache, wiping out any prior values in cache
    async fill(season?: number) {
        this.checkStatus('empty', 'full');
        this.setStatus('filling');

        this.data = {};

        // This is crap and should be fixed ASAP
        this.season = season !== undefined ? season : g.season;
        if (this.season === undefined) {
            const seasonAttr = await g.dbl.gameAttributes.get('season');
            if (seasonAttr) {
                this.season = seasonAttr.value;
            }
        }
        if (this.season === undefined) {
            throw new Error('Undefined season');
        }

        await g.dbl.tx(STORES, async (tx) => {
            // Non-retired players - this is special because it's used for players and playerStats
            const [players1, players2] = await Promise.all([
                tx.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.UNDRAFTED)),
                tx.players.index('tid').getAll(backboard.bound(g.PLAYER.UNDRAFTED_FANTASY_TEMP, g.PLAYER.UNDRAFTED_2)),
            ]);

            const players = players1.concat(players2);

            await Promise.all(STORES.map((store) => {
                return this.loadStore(store, tx, players);
            }));
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
                const val = this.indexes[index][key];
                if (!Array.isArray(val)) {
                    return [val];
                }
                return val;
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

        if (['events', 'games', 'messages', 'negotiations', 'playerFeats', 'schedule', 'trade'].includes(store)) {
            // This works if no indexes

            const pk = this.storeInfos[store].pk;
            if (obj.hasOwnProperty(pk)) {
                if (this.data[store][obj[pk]]) {
                    throw new Error(`Primary key ${obj[pk]} already exists in "${store}"`);
                }
            } else {
                this.maxIds[store] += 1;
                obj[pk] = this.maxIds[store];
            }

            this.data[store][obj[pk]] = obj;
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

            if (obj.season === this.season) {
                this.indexes.playerStatsByPid[obj.pid] = obj;
            }

            if (!obj.playoffs) {
                if (!this.indexes.playerStatsAllByPid.hasOwnProperty(obj.pid)) {
                    this.indexes.playerStatsAllByPid[obj.pid] = [obj];
                } else {
                    this.indexes.playerStatsAllByPid[obj.pid].push(obj);
                }
            }
        } else {
            throw new Error(`Cache.add not implemented for store "${store}"`);
        }
    }

    async put(store: Store, obj: any) {
        this.checkStatus('full');

        const pk = this.storeInfos[store].pk;

        if (['awards', 'gameAttributes'].includes(store)) {
            // This works if no indexes and no auto incrementing primary key, otherwise it should auto assign primary key

            if (!obj.hasOwnProperty(pk)) {
                throw new Error(`Cannot put "${store}" object without primary key "${pk}": ${JSON.stringify(obj)}`);
            }

            this.data[store][obj[pk]] = obj;
        } else {
            throw new Error(`Cache.put not implemented for store "${store}"`);
        }
    }

    async delete(store: Store, key: number) {
        this.checkStatus('full');

        if (['negotiations', 'schedule'].includes(store)) {
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

        if (['negotiations', 'schedule'].includes(store)) {
            for (const key of Object.keys(this.data[store])) {
                delete this.data[store][this.storeInfos[store].pk];
                this.deletes[store].add(key);
            }
        } else {
            throw new Error(`clear not implemented for store "${store}"`);
        }
    }
}

export default Cache;
