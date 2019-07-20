// @flow

import backboard from "backboard";
import { PLAYER } from "../../common";
import { idb } from ".";
import cmp from "./cmp";
import { g, local, lock } from "../util";
import type {
    BackboardTx,
    DraftLotteryResult,
    DraftPick,
    DraftPickWithoutDpid,
    EventBBGM,
    Game,
    GameAttribute,
    Message,
    MessageWithoutMid,
    MinimalPlayerRatings,
    Negotiation,
    Player,
    PlayerFeat,
    PlayerWithoutPid,
    PlayoffSeries,
    ReleasedPlayer,
    ReleasedPlayerWithoutRid,
    ScheduleGame,
    TeamSeason,
    TeamStats,
    Team,
    Trade,
} from "../../common/types";

type Status = "empty" | "error" | "filling" | "full";

// Only these IDB object stores for now. Keep in memory only player info for non-retired players and team info for the current season.
export type Store =
    | "awards"
    | "draftLotteryResults"
    | "draftPicks"
    | "events"
    | "gameAttributes"
    | "games"
    | "messages"
    | "negotiations"
    | "playerFeats"
    | "players"
    | "playoffSeries"
    | "releasedPlayers"
    | "schedule"
    | "teamSeasons"
    | "teamStats"
    | "teams"
    | "trade";
type Index =
    | "draftPicksBySeason"
    | "draftPicksByTid"
    | "playersByDraftYearRetiredYear"
    | "playersByTid"
    | "releasedPlayers"
    | "releasedPlayersByTid"
    | "teamSeasonsBySeasonTid"
    | "teamSeasonsByTidSeason"
    | "teamStatsByPlayoffsTid";

// This variable is only needed because Object.keys(storeInfos) is not handled well in Flow
export const STORES: Store[] = [
    "awards",
    "draftLotteryResults",
    "draftPicks",
    "events",
    "gameAttributes",
    "games",
    "messages",
    "negotiations",
    "playerFeats",
    "players",
    "playoffSeries",
    "releasedPlayers",
    "schedule",
    "teamSeasons",
    "teamStats",
    "teams",
    "trade",
];

const AUTO_FLUSH_INTERVAL = 4000; // 4 seconds

// Hacks to support stringifying/parsing an array containing strings and numbers, including Infinity. Currently used for retiredYear.
const stringifyInfinity = array => {
    return JSON.stringify(array);
};
const parseInfinity = string => {
    return JSON.parse(string).map(val => (val === null ? Infinity : val));
};

const getIndexKey = (index, row) => {
    if (index.key.length === 1) {
        // $FlowFixMe
        return row[index.key[0]];
    }

    // Array keys are special, because they need to be stored in a JS object and then recovered
    return stringifyInfinity(
        index.key
            // $FlowFixMe
            .map(field => {
                // $FlowFixMe
                return field === "draft.year" ? row.draft.year : row[field];
            }),
    );
};

class StoreAPI<Input, Output, ID> {
    // eslint-disable-next-line no-use-before-define
    cache: Cache;

    store: Store;

    // eslint-disable-next-line no-use-before-define
    constructor(cache: Cache, store: Store) {
        this.cache = cache;
        this.store = store;
    }

    get(id: ID): Promise<Output> {
        if (typeof id !== "number" && typeof id !== "string") {
            throw new Error("Invalid input type");
        }
        return this.cache._get(this.store, id);
    }

    getAll(): Promise<Output[]> {
        return this.cache._getAll(this.store);
    }

    // Not sure how to type key as ID in some methods below
    indexGet(
        index: Index,
        key: number | string | (number | string | boolean)[],
    ): Promise<Output> {
        return this.cache._indexGet(index, key);
    }

    indexGetAll(
        index: Index,
        key: number | string | [any, any] | any[],
    ): Promise<Output[]> {
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
        return this.cache._clear(this.store);
    }
}

class Cache {
    _data: { [key: Store]: any };

    _deletes: { [key: Store]: Set<number | string> };

    _dirty: boolean;

    _dirtyIndexes: Set<Store>;

    _dirtyRecords: { [key: Store]: Set<number | string> };

    _index2store: { [key: Index]: Store };

    _indexes: { [key: Index]: any };

    _instanceNum: number;

    _maxIds: { [key: Store]: number };

    newLeague: boolean;

    _requestInd: number;

    _requestQueue: Map<
        number,
        { resolve: () => void, validStatuses: Status[] },
    >;

    _status: Status;

    _season: number;

    _stopAutoFlush: boolean;

    storeInfos: {
        [key: Store]: {
            pk: string,
            pkType: "number" | "string",
            autoIncrement: boolean,
            getData?: BackboardTx => Promise<any[]> | any[],
            indexes?: {
                name: Index,
                filter?: any => boolean,
                key: string[],
                unique?: boolean,
            }[],
        },
    };

    awards: StoreAPI<Object, Object, number>;

    draftLotteryResults: StoreAPI<
        DraftLotteryResult,
        DraftLotteryResult,
        number,
    >;

    draftPicks: StoreAPI<DraftPick | DraftPickWithoutDpid, DraftPick, number>;

    events: StoreAPI<EventBBGM, EventBBGM, number>;

    gameAttributes: StoreAPI<GameAttribute, GameAttribute, string>;

    games: StoreAPI<Game, Game, number>;

    messages: StoreAPI<Message | MessageWithoutMid, Message, number>;

    negotiations: StoreAPI<Negotiation, Negotiation, number>;

    playerFeats: StoreAPI<PlayerFeat, PlayerFeat, number>;

    players: StoreAPI<
        Player<MinimalPlayerRatings> | PlayerWithoutPid<MinimalPlayerRatings>,
        Player<MinimalPlayerRatings>,
        number,
    >;

    playoffSeries: StoreAPI<PlayoffSeries, PlayoffSeries, number>;

    releasedPlayers: StoreAPI<
        ReleasedPlayer | ReleasedPlayerWithoutRid,
        ReleasedPlayer,
        number,
    >;

    schedule: StoreAPI<ScheduleGame, ScheduleGame, number>;

    teamSeasons: StoreAPI<TeamSeason, TeamSeason, number>;

    teamStats: StoreAPI<TeamStats, TeamStats, number>;

    teams: StoreAPI<Team, Team, number>;

    trade: StoreAPI<Trade, Trade, number>;

    constructor() {
        this._status = "empty";

        this._data = {};
        this._deletes = {};
        this._dirty = false;
        this._dirtyIndexes = new Set();
        this._dirtyRecords = {};
        this._indexes = {};
        this._maxIds = {};
        this.newLeague = false;
        this._requestQueue = new Map();
        this._requestInd = 0;
        this._stopAutoFlush = false;

        this.storeInfos = {
            awards: {
                pk: "season",
                pkType: "number",
                autoIncrement: false,
            },
            draftLotteryResults: {
                pk: "season",
                pkType: "number",
                autoIncrement: false,
            },
            draftPicks: {
                pk: "dpid",
                pkType: "number",
                autoIncrement: true,
                getData: (tx: BackboardTx) => tx.draftPicks.getAll(),
                indexes: [
                    {
                        name: "draftPicksBySeason",
                        key: ["season"],
                    },
                    {
                        name: "draftPicksByTid",
                        key: ["tid"],
                    },
                ],
            },
            events: {
                pk: "eid",
                pkType: "number",
                autoIncrement: true,
            },
            gameAttributes: {
                pk: "key",
                pkType: "string",
                autoIncrement: false,
                getData: (tx: BackboardTx) => tx.gameAttributes.getAll(),
            },
            games: {
                pk: "gid",
                pkType: "number",
                autoIncrement: false,

                // Current season
                getData: (tx: BackboardTx) =>
                    tx.games.index("season").getAll(this._season),
            },
            messages: {
                pk: "mid",
                pkType: "number",
                autoIncrement: true,
            },
            negotiations: {
                pk: "pid",
                pkType: "number",
                autoIncrement: false,
                getData: (tx: BackboardTx) => tx.negotiations.getAll(),
            },
            playerFeats: {
                pk: "fid",
                pkType: "number",
                autoIncrement: true,
            },
            players: {
                pk: "pid",
                pkType: "number",
                autoIncrement: true,
                getData: async (tx: BackboardTx) => {
                    // Non-retired players
                    const [players1, players2] = await Promise.all([
                        tx.players
                            .index("tid")
                            .getAll(backboard.lowerBound(PLAYER.UNDRAFTED)),
                        tx.players
                            .index("tid")
                            .getAll(PLAYER.UNDRAFTED_FANTASY_TEMP),
                    ]);

                    return players1.concat(players2);
                },
                indexes: [
                    {
                        name: "playersByTid",
                        key: ["tid"],
                    },
                    {
                        name: "playersByDraftYearRetiredYear",
                        key: ["draft.year", "retiredYear"],
                    },
                ],
            },
            playoffSeries: {
                pk: "season",
                pkType: "number",
                autoIncrement: false,

                // Current season
                getData: (tx: BackboardTx) =>
                    tx.playoffSeries.getAll(this._season),
            },
            releasedPlayers: {
                pk: "rid",
                pkType: "number",
                autoIncrement: true,
                getData: (tx: BackboardTx) => tx.releasedPlayers.getAll(),
                indexes: [
                    {
                        name: "releasedPlayersByTid",
                        key: ["tid"],
                    },
                ],
            },
            schedule: {
                pk: "gid",
                pkType: "number",
                autoIncrement: true,
                getData: (tx: BackboardTx) => tx.schedule.getAll(),
            },
            teamSeasons: {
                pk: "rid",
                pkType: "number",
                autoIncrement: true,

                // Past 3 seasons
                getData: (tx: BackboardTx) => {
                    return tx.teamSeasons
                        .index("season, tid")
                        .getAll(
                            backboard.bound(
                                [this._season - 2],
                                [this._season, ""],
                            ),
                        );
                },

                indexes: [
                    {
                        name: "teamSeasonsBySeasonTid",
                        key: ["season", "tid"],
                        unique: true,
                    },
                    {
                        name: "teamSeasonsByTidSeason",
                        key: ["tid", "season"],
                        unique: true,
                    },
                ],
            },
            teamStats: {
                pk: "rid",
                pkType: "number",
                autoIncrement: true,

                // Current season
                getData: (tx: BackboardTx) => {
                    return tx.teamStats
                        .index("season, tid")
                        .getAll(
                            backboard.bound([this._season], [this._season, ""]),
                        );
                },

                indexes: [
                    {
                        name: "teamStatsByPlayoffsTid",
                        key: ["playoffs", "tid"],
                        unique: true,
                    },
                ],
            },
            teams: {
                pk: "tid",
                pkType: "number",
                autoIncrement: false,
                getData: (tx: BackboardTx) => tx.teams.getAll(),
            },
            trade: {
                pk: "rid",
                pkType: "number",
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

        this.awards = new StoreAPI(this, "awards");
        this.draftLotteryResults = new StoreAPI(this, "draftLotteryResults");
        this.draftPicks = new StoreAPI(this, "draftPicks");
        this.events = new StoreAPI(this, "events");
        this.gameAttributes = new StoreAPI(this, "gameAttributes");
        this.games = new StoreAPI(this, "games");
        this.messages = new StoreAPI(this, "messages");
        this.negotiations = new StoreAPI(this, "negotiations");
        this.playerFeats = new StoreAPI(this, "playerFeats");
        this.players = new StoreAPI(this, "players");
        this.playoffSeries = new StoreAPI(this, "playoffSeries");
        this.releasedPlayers = new StoreAPI(this, "releasedPlayers");
        this.schedule = new StoreAPI(this, "schedule");
        this.teamSeasons = new StoreAPI(this, "teamSeasons");
        this.teamStats = new StoreAPI(this, "teamStats");
        this.teams = new StoreAPI(this, "teams");
        this.trade = new StoreAPI(this, "trade");
    }

    _validateStatus(...validStatuses: Status[]) {
        if (!validStatuses.includes(this._status)) {
            throw new Error(`Invalid cache status "${this._status}"`);
        }
    }

    _waitForStatus(...validStatuses: Status[]): Promise<void> | void {
        if (!validStatuses.includes(this._status)) {
            return new Promise((resolve, reject) => {
                this._requestInd += 1;
                const ind = this._requestInd;
                this._requestQueue.set(ind, { resolve, validStatuses });

                setTimeout(() => {
                    reject(
                        new Error(
                            `Timeout while waiting for valid status (${validStatuses.join(
                                "/",
                            )})`,
                        ),
                    );
                    this._requestQueue.delete(ind);
                }, 30000);
            });
        }
    }

    _setStatus(status: Status) {
        this._status = status;

        for (const [ind, entry] of this._requestQueue.entries()) {
            if (entry.validStatuses.includes(status)) {
                entry.resolve();
                this._requestQueue.delete(ind);
            }
        }
    }

    _markDirtyIndexes(store: Store, row: any) {
        if (!this.storeInfos[store].indexes || this._dirtyIndexes.has(store)) {
            return;
        }

        if (row) {
            for (const index of this.storeInfos[store].indexes) {
                const key = getIndexKey(index, row);

                if (!index.unique) {
                    if (
                        !this._indexes[index.name].hasOwnProperty(key) ||
                        !this._indexes[index.name][key].includes(row)
                    ) {
                        this._dirtyIndexes.add(store);
                        break;
                    }
                } else if (this._indexes[index.name][key] !== row) {
                    this._dirtyIndexes.add(store);
                    break;
                }
            }
        } else {
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

                    const key = getIndexKey(index, row);

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

    async _loadStore(store: Store, tx: BackboardTx) {
        const storeInfo = this.storeInfos[store];

        this._deletes[store] = new Set();
        this._dirtyRecords[store] = new Set();

        // Load data and do maxIds calculation in parallel
        await Promise.all([
            (async () => {
                // No getData implies no need to store any records in cache except new ones
                const data = storeInfo.getData
                    ? await storeInfo.getData(tx)
                    : [];

                this._data[store] = {};
                for (const row of data) {
                    const key = row[storeInfo.pk];
                    this._data[store][key] = row;
                }

                this._refreshIndexes(store);
            })(),
            (async () => {
                // Special case for games is due to interaction with schedule (see hack below)
                if (storeInfo.autoIncrement || store === "games") {
                    this._maxIds[store] = -1;
                    await tx[store].iterate(
                        null,
                        "prev",
                        (row, shortCircuit) => {
                            if (row) {
                                this._maxIds[store] = row[storeInfo.pk];
                            }
                            shortCircuit();
                        },
                    );
                }
            })(),
        ]);
    }

    // Load database from disk and save in cache, wiping out any prior values in cache
    async fill(season?: number) {
        //console.log('fill start');
        //performance.mark('fillStart');
        this._validateStatus("empty", "full");
        this._setStatus("filling");

        this._data = {};

        // This is crap and should be fixed ASAP
        this._season = season !== undefined ? season : g.season;
        if (this._season === undefined) {
            const seasonAttr = await idb.league.gameAttributes.get("season");
            if (seasonAttr) {
                this._season = seasonAttr.value;
            }
        }
        if (this._season === undefined) {
            // Seems that gameAttributes is empty when this happens, possibly due to Chrome inappropriately deleting things?
            console.log("Passed season", season);
            console.log("g.season", season);
            console.log(
                "game attributes",
                JSON.stringify(
                    await idb.league.gameAttributes.getAll(),
                    undefined,
                    2,
                ),
            );
            throw new Error("Undefined season");
        }

        await Promise.all(
            STORES.map(store => {
                return this._loadStore(store, idb.league);
            }),
        );

        // HACK - special case for schedule store, maxId can come from schedule or games because we can't rely on schedule always being populated
        if (this._maxIds.schedule < this._maxIds.games) {
            this._maxIds.schedule = this._maxIds.games;
        }

        this._dirty = false;

        this._setStatus("full");
        //performance.measure('fillTime', 'fillStart');
        //const entries = performance.getEntriesByName('fillTime');
        //console.log(`${g.phase} fill duration: ${entries[entries.length - 1].duration / 1000} seconds`);
    }

    // Take current contents in database and write to disk
    async flush() {
        //console.log('flush start');
        //performance.mark('flushStart');
        this._validateStatus("full");

        await idb.league.tx(STORES, "readwrite", tx => {
            // This is synchronous not because of Firefox, but to prevent any race condition
            for (const store of STORES) {
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

                this._dirty = false;
            }
        });
        //performance.measure('flushTime', 'flushStart');
        //const entries = performance.getEntriesByName('flushTime');
        //console.log(`${g.phase} flush duration: ${entries[entries.length - 1].duration / 1000} seconds`);
    }

    async _autoFlush() {
        if (this._stopAutoFlush) {
            return;
        }

        // Only flush if cache is dirty and nothing is going on
        if (this._dirty) {
            const skipFlush =
                lock.get("gameSim") ||
                lock.get("newPhase") ||
                local.autoPlaySeasons > 0;
            if (!skipFlush) {
                await this.flush();
            }
        }

        setTimeout(() => {
            this._autoFlush();
        }, AUTO_FLUSH_INTERVAL);
    }

    startAutoFlush() {
        this._stopAutoFlush = false;
        setTimeout(() => {
            this._autoFlush();
        }, AUTO_FLUSH_INTERVAL);
    }

    stopAutoFlush() {
        this._stopAutoFlush = true;
    }

    async _get(store: Store, id: number | string): Promise<any> {
        await this._waitForStatus("full");

        return this._data[store][id];
    }

    async _getAll(store: Store): Promise<any[]> {
        await this._waitForStatus("full");

        return Object.values(this._data[store]);
    }

    _checkIndexFreshness(index: Index) {
        const store = this._index2store[index];
        if (this._dirtyIndexes.has(store)) {
            this._refreshIndexes(store);
        }
    }

    async _indexGet(
        index: Index,
        key: number | string | (number | string | boolean)[],
    ): Promise<any> {
        await this._waitForStatus("full");
        this._checkIndexFreshness(index);

        // Array keys are special, because they need to be stored in a JS object and then recovered
        const actualKey = Array.isArray(key) ? stringifyInfinity(key) : key;

        const val = this._indexes[index][actualKey];

        if (Array.isArray(val)) {
            return val[0];
        }
        return val;
    }

    // Key is kind of like IDB key range, except there is no "only" support for compound keys so in that case you have to query like [[2018, 1], [2018, 1]] instead of [2018, 1], otherwise it can't tell if it's an "only" compound key or a min/max range for a numeric key
    async _indexGetAll(
        index: Index,
        key: number | string | [any, any] | any[],
    ): Promise<any[]> {
        await this._waitForStatus("full");
        this._checkIndexFreshness(index);

        if (typeof key === "number" || typeof key === "string") {
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
        for (const keyString of Object.keys(this._indexes[index])) {
            let keyParsed;
            // Array keys are special, because they need to be stored in a JS object and then recovered
            if (Array.isArray(min)) {
                keyParsed = parseInfinity(keyString);
            } else if (typeof min === "number") {
                keyParsed = parseFloat(keyString);
                if (Number.isNaN(keyParsed)) {
                    throw new Error(
                        `Was expecting numeric key for index "${index}" but got "${keyString}"`,
                    );
                }
            } else {
                keyParsed = keyString;
            }
            if (cmp(keyParsed, min) >= 0 && cmp(keyParsed, max) <= 0) {
                output = output.concat(this._indexes[index][keyString]);
            }
        }
        return output;
    }

    async _storeObj(
        type: "add" | "put",
        store: Store,
        obj: any,
    ): Promise<number | string> {
        await this._waitForStatus("full");

        const pk = this.storeInfos[store].pk;
        if (obj.hasOwnProperty(pk)) {
            if (type === "add" && this._data[store][obj[pk]]) {
                throw new Error(
                    `Primary key "${obj[pk]}" already exists in "${store}"`,
                );
            }

            if (
                this._maxIds.hasOwnProperty(store) &&
                obj[pk] > this._maxIds[store]
            ) {
                this._maxIds[store] = obj[pk];
            }
        } else {
            if (!this.storeInfos[store].autoIncrement) {
                throw new Error(
                    `Primary key field "${pk}" is required for non-autoincrementing store "${store}"`,
                );
            }

            this._maxIds[store] += 1;
            obj[pk] = this._maxIds[store];
        }

        this._data[store][obj[pk]] = obj;

        // Need to have the correct type here for IndexedDB
        const idParsed =
            this.storeInfos[store].pkType === "number"
                ? parseInt(obj[pk], 10)
                : obj[pk];
        this._dirtyRecords[store].add(idParsed);
        this._dirty = true;
        this._markDirtyIndexes(store, obj);

        return obj[pk];
    }

    _add(store: Store, obj: any): Promise<number | string> {
        return this._storeObj("add", store, obj);
    }

    _put(store: Store, obj: any): Promise<number | string> {
        return this._storeObj("put", store, obj);
    }

    async _delete(store: Store, id: number) {
        await this._waitForStatus("full");

        if (
            [
                "draftPicks",
                "negotiations",
                "players",
                "releasedPlayers",
                "schedule",
                "teamSeasons",
                "teamStats",
                "teams",
            ].includes(store)
        ) {
            if (this._data[store].hasOwnProperty(id)) {
                delete this._data[store][id];
            }

            // Need to have the correct type here for IndexedDB
            const idParsed =
                this.storeInfos[store].pkType === "number"
                    ? parseInt(id, 10)
                    : id;
            this._deletes[store].add(idParsed);
            this._dirty = true;
            this._markDirtyIndexes(store);
        } else {
            throw new Error(`delete not implemented for store "${store}"`);
        }
    }

    async _clear(store: Store) {
        await this._waitForStatus("full");

        if (
            [
                "negotiations",
                "releasedPlayers",
                "schedule",
                "teamSeasons",
            ].includes(store)
        ) {
            for (const id of Object.keys(this._data[store])) {
                delete this._data[store][id];

                // Need to have the correct type here for IndexedDB
                const idParsed =
                    this.storeInfos[store].pkType === "number"
                        ? parseInt(id, 10)
                        : id;
                this._deletes[store].add(idParsed);
            }
            this._dirty = true;
            this._markDirtyIndexes(store);
        } else {
            throw new Error(`clear not implemented for store "${store}"`);
        }
    }
}

export default Cache;
