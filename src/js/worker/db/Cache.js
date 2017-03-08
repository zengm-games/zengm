// @flow

import backboard from 'backboard';
import orderBy from 'lodash.orderby';
import {PLAYER, g} from '../../common';
import {idb} from '../db';
import type {
    Awards,
    BackboardTx,
    DraftOrder,
    DraftPick,
    DraftPickWithoutDpid,
    EventBBGM,
    Game,
    GameAttribute,
    Message,
    Negotiation,
    Player,
    PlayerFeat,
    PlayerStats,
    PlayerWithoutPid,
    PlayoffSeries,
    ReleasedPlayer,
    ReleasedPlayerWithoutRid,
    ScheduleGame,
    TeamSeason,
    TeamStats,
    Team,
    Trade,
} from '../../common/types';

type Status = 'empty' | 'error' | 'filling' | 'full';

// Only these IDB object stores for now. Keep in memory only player info for non-retired players and team info for the current season.
type Store = 'awards' | 'draftOrder' | 'draftPicks' | 'events' | 'gameAttributes' | 'games' | 'messages' | 'negotiations' | 'playerFeats' | 'playerStats' | 'players' | 'playoffSeries' | 'releasedPlayers' | 'schedule' | 'teamSeasons' | 'teamStats' | 'teams' | 'trade';
type Index = 'draftPicksBySeason' | 'draftPicksByTid' | 'playerStats' | 'playerStatsAllByPid' | 'playerStatsByPid' | 'playersByTid' | 'releasedPlayers' | 'releasedPlayersByTid' | 'teamSeasonsBySeasonTid' | 'teamSeasonsByTidSeason' | 'teamStatsByPlayoffsTid';

// This variable is only needed because Object.keys(storeInfos) is not handled well in Flow
const STORES: Store[] = ['awards', 'draftOrder', 'draftPicks', 'events', 'gameAttributes', 'games', 'messages', 'negotiations', 'playerFeats', 'playerStats', 'players', 'playoffSeries', 'releasedPlayers', 'schedule', 'teamSeasons', 'teamStats', 'teams', 'trade'];

class StoreAPI<Input, Output, ID> {
    cache: Cache;
    store: Store;

    constructor(cache: Cache, store: Store) {
        this.cache = cache;
        this.store = store;
    }

    get(id: ID): Promise<Output> {
        if (typeof id !== 'number' && typeof id !== 'string') {
            throw new Error('Invalid input type');
        }
        return this.cache._get(this.store, id);
    }

    getAll(): Promise<Output[]> {
        return this.cache._getAll(this.store);
    }

    indexGet(index: Index, key: ID | string): Promise<Output> {
        if (typeof key !== 'number' && typeof key !== 'string') {
            throw new Error('Invalid input type');
        }
        return this.cache._indexGet(index, key);
    }

    // Not sure how to type key as ID in some methods below
    indexGetAll(index: Index, key: number | string | [number, number] | [string, string]): Promise<Output[]> {
        return this.cache._indexGetAll(index, key);
    }

    add(obj: Input): Promise<number | string> {
        return this.cache._add(this.store, obj);
    }

    put(obj: Input): Promise<number | string> {
        return this.cache._put(this.store, obj);
    }

    delete(id: number): Promise<void> {
        return this.cache._delete(this.store, id);
    }

    clear(): Promise<void> {
console.log('clear', this.store);
        return this.cache._clear(this.store);
    }
}

class Cache {
    _data: {[key: Store]: any};
    _deletes: {[key: Store]: Set<number>};
    _dirtyIndexes: Set<Store>; // Does not distinguish individual indexes, just which stores have dirty indexes. Currently this distinction is not meaningful, but if it is at some point, this should be changed.
    _dirtyRecords: {[key: Store]: Set<number | string>};
    _index2store: {[key: Index]: Store};
    _indexes: {[key: Index]: any};
    _lid: number;
    _maxIds: {[key: Store]: number};
    newLeague: boolean;
    _status: Status;
    _season: number;
    storeInfos: {
        [key: Store]: {
            pk: string,
            autoIncrement: boolean,
            getData?: (BackboardTx, Player[]) => (Promise<any[]> | any[]),
            indexes?: {
                name: Index,
                filter?: (any) => boolean,
                key: (any) => string,
                unique?: boolean,
            }[],
        },
    };

    awards: StoreAPI<Awards, Awards, number>;
    draftOrder: StoreAPI<DraftOrder, DraftOrder, number>;
    draftPicks: StoreAPI<(DraftPick | DraftPickWithoutDpid), DraftPick, number>;
    events: StoreAPI<EventBBGM, EventBBGM, number>;
    gameAttributes: StoreAPI<GameAttribute, GameAttribute, string>;
    games: StoreAPI<Game, Game, number>;
    messages: StoreAPI<Message, Message, number>;
    negotiations: StoreAPI<Negotiation, Negotiation, number>;
    playerFeats: StoreAPI<PlayerFeat, PlayerFeat, number>;
    playerStats: StoreAPI<PlayerStats, PlayerStats, number>;
    players: StoreAPI<(Player | PlayerWithoutPid), Player, number>;
    playoffSeries: StoreAPI<PlayoffSeries, PlayoffSeries, number>;
    releasedPlayers: StoreAPI<(ReleasedPlayer | ReleasedPlayerWithoutRid), ReleasedPlayer, number>;
    schedule: StoreAPI<ScheduleGame, ScheduleGame, number>;
    teamSeasons: StoreAPI<TeamSeason, TeamSeason, number>;
    teamStats: StoreAPI<TeamStats, TeamStats, number>;
    teams: StoreAPI<Team, Team, number>;
    trade: StoreAPI<Trade, Trade, number>;

    constructor() {
        this._status = 'empty';

        this._data = {};
        this._deletes = {};
        this._dirtyIndexes = new Set();
        this._dirtyRecords = {};
        this._indexes = {};
        this._maxIds = {};
        this.newLeague = false;

        this.storeInfos = {
            awards: {
                pk: 'season',
                autoIncrement: false,
            },
            draftOrder: {
                pk: 'rid',
                autoIncrement: false,
                getData: (tx: BackboardTx) => tx.draftOrder.getAll(),
            },
            draftPicks: {
                pk: 'dpid',
                autoIncrement: true,
                getData: (tx: BackboardTx) => tx.draftPicks.getAll(),
                indexes: [{
                    name: 'draftPicksBySeason',
                    key: (row) => String(row.season),
                }, {
                    name: 'draftPicksByTid',
                    key: (row) => String(row.tid),
                }],
            },
            events: {
                pk: 'eid',
                autoIncrement: true,
            },
            gameAttributes: {
                pk: 'key',
                autoIncrement: false,
                getData: (tx: BackboardTx) => tx.gameAttributes.getAll(),
            },
            games: {
                pk: 'gid',
                autoIncrement: false,

                // Current season
                getData: (tx: BackboardTx) => tx.games.index('season').getAll(this._season),
            },
            messages: {
                pk: 'mid',
                autoIncrement: true,
            },
            negotiations: {
                pk: 'pid',
                autoIncrement: false,
                getData: (tx: BackboardTx) => tx.negotiations.getAll(),
            },
            playerFeats: {
                pk: 'fid',
                autoIncrement: true,
            },
            playerStats: {
                pk: 'psid',
                autoIncrement: true,

                getData: async (tx: BackboardTx, players: Player[]) => {
                    const psNested = await Promise.all(players.map((p) => {
                        return tx.playerStats
                            .index('pid, season, tid')
                            .getAll(backboard.bound([p.pid, this._season - 1], [p.pid, this._season, '']));
                    }));

                    // Flatten
                    const psRows = [].concat(...psNested);

                    return orderBy(psRows, 'psid');
                },

                indexes: [{
                    // Only save latest stats row for each player (so playoff stats if available, and latest team if traded mid-season)
                    name: 'playerStatsByPid',
                    filter: (row) => row.season === this._season,
                    key: (row) => String(row.pid),
                    unique: true,
                }, {
                    name: 'playerStatsAllByPid',
                    key: (row) => String(row.pid),
                }],
            },
            players: {
                pk: 'pid',
                autoIncrement: true,
                getData: (tx: BackboardTx, players: Player[]) => players,
                indexes: [{
                    name: 'playersByTid',
                    key: (row) => String(row.tid),
                }],
            },
            playoffSeries: {
                pk: 'season',
                autoIncrement: false,

                // Current season
                getData: (tx: BackboardTx) => tx.playoffSeries.getAll(this._season),
            },
            releasedPlayers: {
                pk: 'rid',
                autoIncrement: true,
                getData: (tx: BackboardTx) => tx.releasedPlayers.getAll(),
                indexes: [{
                    name: 'releasedPlayersByTid',
                    key: (row) => String(row.tid),
                }],
            },
            schedule: {
                pk: 'gid',
                autoIncrement: true,
                getData: (tx: BackboardTx) => tx.schedule.getAll(),
            },
            teamSeasons: {
                pk: 'rid',
                autoIncrement: true,

                // Past 3 seasons
                getData: (tx: BackboardTx) => {
                    return tx.teamSeasons
                        .index('season, tid')
                        .getAll(backboard.bound([this._season - 2], [this._season, '']));
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
                autoIncrement: true,

                // Current season
                getData: (tx: BackboardTx) => {
                    return tx.teamStats
                        .index('season, tid')
                        .getAll(backboard.bound([this._season], [this._season, '']));
                },

                indexes: [{
                    name: 'teamStatsByPlayoffsTid',
                    key: (row) => `${row.playoffs ? 1 : 0},${row.tid}`,
                    unique: true,
                }],
            },
            teams: {
                pk: 'tid',
                autoIncrement: false,
                getData: (tx: BackboardTx) => tx.teams.getAll(),
            },
            trade: {
                pk: 'rid',
                autoIncrement: false,
                getData: (tx: BackboardTx) => tx.trade.getAll(),
            },
        };

        this._index2store = {};
        for (const store of Object.keys(this.storeInfos)) {
            if (this.storeInfos[store].indexes) {
                for (const index of this.storeInfos[store].indexes) {
                    this._index2store[index.name] = store;
                }
            }
        }

        this.awards = new StoreAPI(this, 'awards');
        this.draftOrder = new StoreAPI(this, 'draftOrder');
        this.draftPicks = new StoreAPI(this, 'draftPicks');
        this.events = new StoreAPI(this, 'events');
        this.gameAttributes = new StoreAPI(this, 'gameAttributes');
        this.games = new StoreAPI(this, 'games');
        this.messages = new StoreAPI(this, 'messages');
        this.negotiations = new StoreAPI(this, 'negotiations');
        this.playerFeats = new StoreAPI(this, 'playerFeats');
        this.playerStats = new StoreAPI(this, 'playerStats');
        this.players = new StoreAPI(this, 'players');
        this.playoffSeries = new StoreAPI(this, 'playoffSeries');
        this.releasedPlayers = new StoreAPI(this, 'releasedPlayers');
        this.schedule = new StoreAPI(this, 'schedule');
        this.teamSeasons = new StoreAPI(this, 'teamSeasons');
        this.teamStats = new StoreAPI(this, 'teamStats');
        this.teams = new StoreAPI(this, 'teams');
        this.trade = new StoreAPI(this, 'trade');
    }

    _checkStatus(...validStatuses: Status[]) {
        if (!validStatuses.includes(this._status)) {
            throw new Error(`Invalid cache status "${this._status}"`);
        }
    }

    _setStatus(status: Status) {
        this._status = status;
    }

    markDirtyIndexes(store: Store) {
        if (this.storeInfos[store].indexes) {
            this._dirtyIndexes.add(store);
        }
    }

    _refreshIndexes(store: Store) {
        const storeInfo = this.storeInfos[store];

        if (storeInfo.indexes) {
            for (const index of storeInfo.indexes) {
                this._indexes[index.name] = {};
                for (const row of Object.values(this._data[store])) {
                    if (index.filter && !index.filter(row)) {
                        continue;
                    }

                    const key = index.key(row);

                    if (!index.unique) {
                        if (!this._indexes[index.name].hasOwnProperty(key)) {
                            this._indexes[index.name][key] = [row];
                        } else {
                            this._indexes[index.name][key].push(row);
                        }
                    } else {
                        this._indexes[index.name][key] = row;
                    }
                }
            }

            this._dirtyIndexes.delete(store);
        }
    }

    async _loadStore(store: Store, tx: BackboardTx, players: Player[]) {
        const storeInfo = this.storeInfos[store];

        this._deletes[store] = new Set();
        this._dirtyRecords[store] = new Set();

        // Load data and do maxIds calculation in parallel
        await Promise.all([
            (async () => {
                // No getData implies no need to store any records in cache except new ones
                const data = storeInfo.getData ? await storeInfo.getData(tx, players) : [];

                this._data[store] = {};
                for (const row of data) {
                    const key = row[storeInfo.pk];
                    this._data[store][key] = row;
                }

                this._refreshIndexes(store);
            })(),
            (async () => {
                // Special case for games is due to interaction with schedule (see hack below)
                if (storeInfo.autoIncrement || store === 'games') {
                    this._maxIds[store] = -1;
                    await tx[store].iterate(null, 'prev', (row, shortCircuit) => {
                        if (row) {
                            this._maxIds[store] = row[storeInfo.pk];
                        }
                        shortCircuit();
                    });
                }
            })(),
        ]);
    }

    // Load database from disk and save in cache, wiping out any prior values in cache
    async fill(season?: number) {
        this._checkStatus('empty', 'full');
        this._setStatus('filling');

        this._data = {};

        // This is crap and should be fixed ASAP
        this._season = season !== undefined ? season : g.season;
        if (this._season === undefined) {
            const seasonAttr = await idb.league.gameAttributes.get('season');
            if (seasonAttr) {
                this._season = seasonAttr.value;
            }
        }
        if (this._season === undefined) {
            throw new Error('Undefined season');
        }

        await idb.league.tx(STORES, async (tx) => {
            // Non-retired players - this is special because it's used for players and playerStats
            const [players1, players2] = await Promise.all([
                tx.players.index('tid').getAll(backboard.lowerBound(PLAYER.UNDRAFTED)),
                tx.players.index('tid').getAll(backboard.bound(PLAYER.UNDRAFTED_FANTASY_TEMP, PLAYER.UNDRAFTED_2)),
            ]);

            const players = players1.concat(players2);

            await Promise.all(STORES.map((store) => {
                return this._loadStore(store, tx, players);
            }));
        });

        // HACK - special case for schedule store, maxId can come from schedule or games because we can't rely on schedule always being populated
        if (this._maxIds.schedule < this._maxIds.games) {
            this._maxIds.schedule = this._maxIds.games;
        }

        this._setStatus('full');
    }

    // Take current contents in database and write to disk
    async flush() {
        this._checkStatus('full');

//performance.mark('flushStart');
        await idb.league.tx(STORES, 'readwrite', async (tx) => {
            await Promise.all(STORES.map(async (store) => {
                for (const id of this._deletes[store]) {
                    tx[store].delete(id);
                }
                this._deletes[store].clear();

                for (const id of this._dirtyRecords[store]) {
                    const record = this._data[store][id];

                    // If record was deleted after being marked as dirty, it will be undefined here
                    if (record !== undefined) {
                        tx[store].put(record);
                    }
                }
                this._dirtyRecords[store].clear();
            }));
        });
//performance.measure('flushTime', 'flushStart');
//const entries = performance.getEntriesByName('flushTime');
//console.log(`${g.phase} flush duration: ${entries[entries.length - 1].duration / 1000} seconds`);
    }

    async _get(store: Store, id: number | string): Promise<any> {
        this._checkStatus('full');

        return this._data[store][id];
    }

    async _getAll(store: Store): Promise<any[]> {
        this._checkStatus('full');

        return Object.values(this._data[store]);
    }

    _checkIndexFreshness(index: Index) {
        const store = this._index2store[index];
        if (this._dirtyIndexes.has(store)) {
            this._refreshIndexes(store);
        }
    }

    async _indexGet(index: Index, key: number | string): Promise<any> {
        this._checkStatus('full');
        this._checkIndexFreshness(index);

        const val = this._indexes[index][key];

        if (Array.isArray(val)) {
            return val[0];
        }
        return val;
    }

    async _indexGetAll(index: Index, key: number | string | [number, number] | [string, string]): Promise<any[]> {
        this._checkStatus('full');
        this._checkIndexFreshness(index);

        if (typeof key === 'number' || typeof key === 'string') {
            if (this._indexes[index].hasOwnProperty(key)) {
                const val = this._indexes[index][key];
                if (!Array.isArray(val)) {
                    return [val];
                }
                return val;
            }
            return [];
        }

        const [min, max] = key;
        let output = [];
        for (const i of Object.keys(this._indexes[index])) {
            if (i >= min && i <= max) {
                output = output.concat(this._indexes[index][i]);
            }
        }
        return output;
    }

    _storeObj(type: 'add' | 'put', store: Store, obj: any): Promise<number | string> {
        this._checkStatus('full');

        const pk = this.storeInfos[store].pk;
        if (obj.hasOwnProperty(pk)) {
            if (type === 'add' && this._data[store][obj[pk]]) {
                throw new Error(`Primary key "${obj[pk]}" already exists in "${store}"`);
            }

            if (this._maxIds.hasOwnProperty(store) && obj[pk] > this._maxIds[store]) {
                this._maxIds[store] = obj[pk];
            }
        } else {
            if (!this.storeInfos[store].autoIncrement) {
                throw new Error(`Primary key field "${pk}" is required for non-autoincrementing store "${store}"`);
            }

            this._maxIds[store] += 1;
            obj[pk] = this._maxIds[store];
        }

        this._data[store][obj[pk]] = obj;

        this._dirtyRecords[store].add(obj[pk]);
        this.markDirtyIndexes(store);

        return obj[pk];
    }

    async _add(store: Store, obj: any): Promise<number | string> {
        return this._storeObj('add', store, obj);
    }

    async _put(store: Store, obj: any): Promise<number | string> {
        return this._storeObj('put', store, obj);
    }

    async _delete(store: Store, id: number) {
        this._checkStatus('full');

        if (['draftPicks', 'negotiations', 'players', 'releasedPlayers', 'schedule', 'teamSeasons'].includes(store)) {
            if (this._data[store].hasOwnProperty(id)) {
                delete this._data[store][id];
                this._deletes[store].add(id);
                this.markDirtyIndexes(store);
            } else {
                throw new Error(`Invalid primary key to delete from store "${store}": ${id}`);
            }
        } else {
            throw new Error(`delete not implemented for store "${store}"`);
        }
    }

    async _clear(store: Store) {
console.log('_clear', store);
        this._checkStatus('full');

        if (['negotiations', 'releasedPlayers', 'schedule', 'teamSeasons'].includes(store)) {
            for (const key of Object.keys(this._data[store])) {
                delete this._data[store][key];
                this._deletes[store].add(key);
            }
console.log('cleared', this._data[store]);
            this.markDirtyIndexes(store);
        } else {
            throw new Error(`clear not implemented for store "${store}"`);
        }
    }
}

export default Cache;
