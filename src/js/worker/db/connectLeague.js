// @flow

import Backboard from 'backboard';
import {player} from '../core';

/**
 * Create a new league database with the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
 * @param {number} lid Integer league ID number for new league.
 */
const createLeague = (upgradeDB, lid: number) => {
    console.log(`Creating league${lid} database`);

    // rid ("row id") is used as the keyPath for objects without an innate unique identifier
    upgradeDB.createObjectStore("awards", {keyPath: "season"});
    upgradeDB.createObjectStore("draftOrder", {keyPath: "rid"});
    upgradeDB.createObjectStore("draftPicks", {keyPath: "dpid", autoIncrement: true});
    const eventStore = upgradeDB.createObjectStore("events", {keyPath: "eid", autoIncrement: true});
    upgradeDB.createObjectStore("gameAttributes", {keyPath: "key"});
    const gameStore = upgradeDB.createObjectStore("games", {keyPath: "gid"});
    upgradeDB.createObjectStore("messages", {keyPath: "mid", autoIncrement: true});
    upgradeDB.createObjectStore("negotiations", {keyPath: "pid"});
    upgradeDB.createObjectStore("playerFeats", {keyPath: "fid", autoIncrement: true});
    const playerStatsStore = upgradeDB.createObjectStore("playerStats", {keyPath: "psid", autoIncrement: true});
    const playerStore = upgradeDB.createObjectStore("players", {keyPath: "pid", autoIncrement: true});
    upgradeDB.createObjectStore("playoffSeries", {keyPath: "season"});
    upgradeDB.createObjectStore("releasedPlayers", {keyPath: "rid", autoIncrement: true});
    upgradeDB.createObjectStore("schedule", {keyPath: "gid", autoIncrement: true});
    const teamSeasonsStore = upgradeDB.createObjectStore("teamSeasons", {keyPath: "rid", autoIncrement: true});
    const teamStatsStore = upgradeDB.createObjectStore("teamStats", {keyPath: "rid", autoIncrement: true});
    upgradeDB.createObjectStore("teams", {keyPath: "tid"});
    upgradeDB.createObjectStore("trade", {keyPath: "rid"});
    upgradeDB.createObjectStore('draftLotteryResults', {keyPath: 'season'});

    eventStore.createIndex("season", "season", {unique: false});
    eventStore.createIndex("pids", "pids", {unique: false, multiEntry: true});
    gameStore.createIndex("season", "season", {unique: false});
    playerStatsStore.createIndex("pid, season, tid", ["pid", "season", "tid"], {unique: false}); // Can't be unique because player could get traded back to same team in one season (and because playoffs is boolean)
    playerStore.createIndex('draft.year, retiredYear', ['draft.year', 'retiredYear'], {unique: false});
    playerStore.createIndex("statsTids", "statsTids", {unique: false, multiEntry: true});
    playerStore.createIndex("tid", "tid", {unique: false});
    teamSeasonsStore.createIndex("season, tid", ["season", "tid"], {unique: true});
    teamSeasonsStore.createIndex("tid, season", ["tid", "season"], {unique: false});
    teamStatsStore.createIndex("season, tid", ["season", "tid"], {unique: false}); // Not unique because of playoffs
    teamStatsStore.createIndex("tid", "tid", {unique: false});
};

/**
 * Migrate a league database to the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion > 0.
 * @param {number} lid Integer league ID number.
 */
const migrateLeague = (upgradeDB, lid) => {
    console.log(`Upgrading league${lid} database from version ${upgradeDB.oldVersion} to version ${upgradeDB.version}`);

    if (upgradeDB.oldVersion <= 15) {
        throw new Error(`League is too old to upgrade (version ${upgradeDB.oldVersion})`);
    }
    if (upgradeDB.oldVersion <= 16) {
        const teamSeasonsStore = upgradeDB.createObjectStore("teamSeasons", {keyPath: "rid", autoIncrement: true});
        const teamStatsStore = upgradeDB.createObjectStore("teamStats", {keyPath: "rid", autoIncrement: true});

        teamSeasonsStore.createIndex("tid, season", ["tid", "season"], {unique: false});
        teamSeasonsStore.createIndex("season, tid", ["season", "tid"], {unique: true});
        teamStatsStore.createIndex("tid", "tid", {unique: false});
        teamStatsStore.createIndex("season, tid", ["season", "tid"], {unique: false});

        upgradeDB.teams.iterate((t) => {
            for (const teamStats of t.stats) {
                teamStats.tid = t.tid;
                if (!teamStats.hasOwnProperty("ba")) {
                    teamStats.ba = 0;
                }
                upgradeDB.teamStats.add(teamStats);
            }
            for (const teamSeason of t.seasons) {
                teamSeason.tid = t.tid;
                upgradeDB.teamSeasons.add(teamSeason);
            }
            delete t.stats;
            delete t.seasons;
            upgradeDB.teams.put(t);
        });
    }
    if (upgradeDB.oldVersion <= 17) {
        // This used to upgrade team logos to the new ones, but Firefox
    }
    if (upgradeDB.oldVersion <= 18) {
        // Split old single string p.name into two names
        upgradeDB.players.iterate((p) => {
            if (p.name) {
                const bothNames = p.name.split(" ");
                p.firstName = bothNames[0];
                p.lastName = bothNames[1];
                delete p.name;
            }
            upgradeDB.players.put(p);
        });
    }
    if (upgradeDB.oldVersion <= 19) {
        // New best records format in awards
        upgradeDB.awards.iterate((a) => {
            if (a.bre && a.brw) {
                a.bestRecordConfs = [a.bre, a.brw];
                a.bestRecord = a.bre.won >= a.brw.won ? a.bre : a.brw;
                delete a.bre;
                delete a.brw;
                upgradeDB.awards.put(a);
            }
        });
    }
    if (upgradeDB.oldVersion <= 20) {
        // Removing indexes when upgrading to cache version
        upgradeDB.draftPicks.deleteIndex('season');
        upgradeDB.draftPicks.deleteIndex('tid');
        upgradeDB.playerFeats.deleteIndex('pid');
        upgradeDB.playerFeats.deleteIndex('tid');
        upgradeDB.players.deleteIndex('draft.year');
        upgradeDB.players.deleteIndex('retiredYear');
        upgradeDB.releasedPlayers.deleteIndex('tid');
        upgradeDB.releasedPlayers.deleteIndex('contract.exp');
    }
    if (upgradeDB.oldVersion <= 21) {
        upgradeDB.players.createIndex('draft.year, retiredYear', ['draft.year', 'retiredYear'], {unique: false});
        upgradeDB.players.iterate((p) => {
            if (p.retiredYear === null || p.retiredYear === undefined) {
                p.retiredYear = Infinity;
                upgradeDB.players.put(p);
            }
        });
    }
    if (upgradeDB.oldVersion <= 22) {
        upgradeDB.createObjectStore('draftLotteryResults', {keyPath: 'season'});
    }
    if (upgradeDB.oldVersion <= 23) {
        upgradeDB.players.iterate((p) => {
            for (const r of p.ratings) {
                r.hgt = player.heightToRating(p.hgt);
            }
            upgradeDB.players.put(p);
        });
    }
};

const connectLeague = async (lid: number) => {
    // Would like to await on migrateLeague and inside there, but Firefox
    const db = await Backboard.open(`league${lid}`, 24, (upgradeDB) => {
        if (upgradeDB.oldVersion === 0) {
            createLeague(upgradeDB, lid);
        } else {
            migrateLeague(upgradeDB, lid);
        }
    });

    db.on('versionchange', () => db.close());

    return db;
};

export default connectLeague;
