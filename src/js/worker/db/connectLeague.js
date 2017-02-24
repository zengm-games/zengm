// @flow

import Backboard from 'backboard';
import Promise from 'bluebird';
import g from '../../globals';
import * as helpers from '../../util/helpers';

/**
 * Create a new league database with the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
 * @param {number} lid Integer league ID number for new league.
 */
const createLeague = (upgradeDB, lid: number) => {
    console.log(`Creating league${lid} database`);

    // rid ("row id") is used as the keyPath for objects without an innate unique identifier
    const playerStore = upgradeDB.createObjectStore("players", {keyPath: "pid", autoIncrement: true});
    const playerStatsStore = upgradeDB.createObjectStore("playerStats", {keyPath: "psid", autoIncrement: true});
    upgradeDB.createObjectStore("teams", {keyPath: "tid"});
    const teamSeasonsStore = upgradeDB.createObjectStore("teamSeasons", {keyPath: "rid", autoIncrement: true});
    const teamStatsStore = upgradeDB.createObjectStore("teamStats", {keyPath: "rid", autoIncrement: true});
    const gameStore = upgradeDB.createObjectStore("games", {keyPath: "gid"});
    upgradeDB.createObjectStore("schedule", {keyPath: "gid", autoIncrement: true});
    upgradeDB.createObjectStore("playoffSeries", {keyPath: "season"});
    const releasedPlayerStore = upgradeDB.createObjectStore("releasedPlayers", {keyPath: "rid", autoIncrement: true});
    upgradeDB.createObjectStore("awards", {keyPath: "season"});
    upgradeDB.createObjectStore("trade", {keyPath: "rid"});
    upgradeDB.createObjectStore("draftOrder", {keyPath: "rid"});
    upgradeDB.createObjectStore("negotiations", {keyPath: "pid"});
    upgradeDB.createObjectStore("gameAttributes", {keyPath: "key"});
    upgradeDB.createObjectStore("messages", {keyPath: "mid", autoIncrement: true});
    const draftPickStore = upgradeDB.createObjectStore("draftPicks", {keyPath: "dpid", autoIncrement: true});
    const eventStore = upgradeDB.createObjectStore("events", {keyPath: "eid", autoIncrement: true});
    const playerFeatStore = upgradeDB.createObjectStore("playerFeats", {keyPath: "fid", autoIncrement: true});

    playerStore.createIndex("tid", "tid", {unique: false});
    playerStore.createIndex("draft.year", "draft.year", {unique: false});
    playerStore.createIndex("retiredYear", "retiredYear", {unique: false});
    playerStore.createIndex("statsTids", "statsTids", {unique: false, multiEntry: true});
    playerStatsStore.createIndex("pid, season, tid", ["pid", "season", "tid"], {unique: false}); // Can't be unique because player could get traded back to same team in one season (and because playoffs is boolean)
//        gameStore.createIndex("tids", "tids", {unique: false, multiEntry: true}); // Not used because currently the season index is used. If multiple indexes are eventually supported, then use this too.
    teamSeasonsStore.createIndex("tid, season", ["tid", "season"], {unique: false});
    teamSeasonsStore.createIndex("season, tid", ["season", "tid"], {unique: true});
    teamStatsStore.createIndex("tid", "tid", {unique: false});
    teamStatsStore.createIndex("season, tid", ["season", "tid"], {unique: false}); // Not unique because of playoffs
    gameStore.createIndex("season", "season", {unique: false});
    releasedPlayerStore.createIndex("tid", "tid", {unique: false});
    releasedPlayerStore.createIndex("contract.exp", "contract.exp", {unique: false});
    draftPickStore.createIndex("season", "season", {unique: false});
    draftPickStore.createIndex("tid", "tid", {unique: false});
    eventStore.createIndex("season", "season", {unique: false});
    eventStore.createIndex("pids", "pids", {unique: false, multiEntry: true});
    playerFeatStore.createIndex("pid", "pid", {unique: false});
    playerFeatStore.createIndex("tid", "tid", {unique: false});
//        eventStore.createIndex("tids", "tids", {unique: false, multiEntry: true}); // Not used currently, but might need to be added later
};

/**
 * Migrate a league database to the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion > 0.
 * @param {number} lid Integer league ID number.
 */
const migrateLeague = async (upgradeDB, lid) => {
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

        await upgradeDB.teams.iterate(async t => {
            for (const teamStats of t.stats) {
                teamStats.tid = t.tid;
                if (!teamStats.hasOwnProperty("ba")) {
                    teamStats.ba = 0;
                }
                await upgradeDB.teamStats.add(teamStats);
            }
            for (const teamSeason of t.seasons) {
                teamSeason.tid = t.tid;
                await upgradeDB.teamSeasons.add(teamSeason);
            }
            delete t.stats;
            delete t.seasons;
            return t;
        });
    }
    if (upgradeDB.oldVersion <= 17) {
        // Use new default team logos, unless teams have been edited
        const teamsDefault = helpers.getTeamsDefault();
        const [teamAbbrevsCache, teamNamesCache, teamRegionsCache] = await Promise.all([
            upgradeDB.gameAttributes.get('teamAbbrevsCache').then(ga => JSON.stringify(ga.value)),
            upgradeDB.gameAttributes.get('teamNamesCache').then(ga => JSON.stringify(ga.value)),
            upgradeDB.gameAttributes.get('teamRegionsCache').then(ga => JSON.stringify(ga.value)),
        ]);

        if (JSON.stringify(teamsDefault.map(t => t.abbrev)) !== teamAbbrevsCache) {
            return;
        }
        if (JSON.stringify(teamsDefault.map(t => t.name)) !== teamNamesCache) {
            return;
        }
        if (JSON.stringify(teamsDefault.map(t => t.region)) !== teamRegionsCache) {
            return;
        }

        await upgradeDB.teams.iterate(async t => {
            if (!t.imgURL) {
                t.imgURL = teamsDefault[t.tid].imgURL;
            }
            return t;
        });
    }
    if (upgradeDB.oldVersion <= 18) {
        // Split old single string p.name into two names
        await upgradeDB.players.iterate(async p => {
            if (p.name) {
                const bothNames = p.name.split(" ");
                p.firstName = bothNames[0];
                p.lastName = bothNames[1];
                delete p.name;
            }
            return p;
        });
    }
    if (upgradeDB.oldVersion <= 19) {
        // New best records format in awards
        await upgradeDB.awards.iterate(async (a) => {
            if (a.bre && a.brw) {
                a.bestRecordConfs = [a.bre, a.brw];
                a.bestRecord = a.bre.won >= a.brw.won ? a.bre : a.brw;
                delete a.bre;
                delete a.brw;
                return a;
            }
        });
    }
};

const connectLeague = async (lid: number) => {
    const db = await Backboard.open(`league${lid}`, 20, async (upgradeDB) => {
        if (upgradeDB.oldVersion === 0) {
            createLeague(upgradeDB, lid);
        } else {
            await migrateLeague(upgradeDB, lid);
        }
    });

    db.on('versionchange', () => db.close());
    g.dbl = db;
};

export default connectLeague;
