// @flow

import backboard from "backboard";
import orderBy from "lodash/orderBy";
import { PLAYER } from "../../common";
import { player } from "../core";
import { bootstrapPot } from "../core/player/develop";
import { logEvent } from "../util";
import type { RatingKey } from "../../common/types";

// I did it this way (with the raw IDB API) because I was afraid it would read all players into memory before getting
// the stats and writing them back to the database. Promises/async/await would help, but Firefox before 60 does not like
// that.
const upgrade29 = tx => {
    let lastCentury = 0;
    // Iterate over players
    tx.objectStore("players").openCursor().onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
            const p = cursor.value;

            // This can be really slow, so need some UI for progress
            const century = Math.floor(p.draft.year / 100);
            if (century > lastCentury) {
                const text = `Upgrading players drafted in the ${century}00s...`;
                logEvent({
                    type: "upgrade",
                    text,
                    saveToDb: false,
                });
                console.log(text);

                lastCentury = century;
            }

            tx
                .objectStore("playerStats")
                .index("pid, season, tid")
                .getAll(
                    // $FlowFixMe
                    IDBKeyRange.bound([p.pid], [p.pid, ""]),
                ).onsuccess = event2 => {
                // Index brings them back maybe out of order
                p.stats = orderBy(event2.target.result, [
                    "season",
                    "playoffs",
                    "psid",
                ]);
                cursor.update(p);
                cursor.continue();
            };
        } else {
            // This seems to trigger a memory leak in Chrome, so leave playerStats behind...
            // tx.db.deleteObjectStore("playerStats");
        }
    };
};

const upgrade31 = tx => {
    tx.objectStore("gameAttributes").get("season").onsuccess = event => {
        const season = event.target.result.value;
        if (typeof season !== "number") {
            throw new Error("Invalid season in upgrade");
        }

        tx.objectStore("draftOrder").get(0).onsuccess = event2 => {
            const draftOrder = event2.target.result.draftOrder;
            if (!Array.isArray(draftOrder)) {
                throw new Error("Invalid draftOrder in upgrade");
            }

            tx.objectStore("draftPicks").openCursor().onsuccess = event3 => {
                const cursor = event3.target.result;
                if (cursor) {
                    const dp = cursor.value;
                    dp.pick = 0;
                    cursor.update(dp);
                    cursor.continue();
                } else {
                    for (const dp2 of draftOrder) {
                        dp2.season = season;
                        tx.objectStore("draftPicks").put(dp2);
                    }
                }
            };
        };
    };
};

/**
 * Create a new league database with the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
 * @param {number} lid Integer league ID number for new league.
 */
const createLeague = (upgradeDB, lid: number) => {
    console.log(`Creating league${lid} database`);

    // rid ("row id") is used as the keyPath for objects without an innate unique identifier
    upgradeDB.createObjectStore("awards", { keyPath: "season" });
    upgradeDB.createObjectStore("draftPicks", {
        keyPath: "dpid",
        autoIncrement: true,
    });
    const eventStore = upgradeDB.createObjectStore("events", {
        keyPath: "eid",
        autoIncrement: true,
    });
    upgradeDB.createObjectStore("gameAttributes", { keyPath: "key" });
    const gameStore = upgradeDB.createObjectStore("games", { keyPath: "gid" });
    upgradeDB.createObjectStore("messages", {
        keyPath: "mid",
        autoIncrement: true,
    });
    upgradeDB.createObjectStore("negotiations", { keyPath: "pid" });
    upgradeDB.createObjectStore("playerFeats", {
        keyPath: "fid",
        autoIncrement: true,
    });
    const playerStore = upgradeDB.createObjectStore("players", {
        keyPath: "pid",
        autoIncrement: true,
    });
    upgradeDB.createObjectStore("playoffSeries", { keyPath: "season" });
    upgradeDB.createObjectStore("releasedPlayers", {
        keyPath: "rid",
        autoIncrement: true,
    });
    upgradeDB.createObjectStore("schedule", {
        keyPath: "gid",
        autoIncrement: true,
    });
    const teamSeasonsStore = upgradeDB.createObjectStore("teamSeasons", {
        keyPath: "rid",
        autoIncrement: true,
    });
    const teamStatsStore = upgradeDB.createObjectStore("teamStats", {
        keyPath: "rid",
        autoIncrement: true,
    });
    upgradeDB.createObjectStore("teams", { keyPath: "tid" });
    upgradeDB.createObjectStore("trade", { keyPath: "rid" });
    upgradeDB.createObjectStore("draftLotteryResults", { keyPath: "season" });

    eventStore.createIndex("season", "season", { unique: false });
    eventStore.createIndex("pids", "pids", { unique: false, multiEntry: true });
    gameStore.createIndex("season", "season", { unique: false });
    playerStore.createIndex(
        "draft.year, retiredYear",
        ["draft.year", "retiredYear"],
        { unique: false },
    );
    playerStore.createIndex("statsTids", "statsTids", {
        unique: false,
        multiEntry: true,
    });
    playerStore.createIndex("tid", "tid", { unique: false });
    teamSeasonsStore.createIndex("season, tid", ["season", "tid"], {
        unique: true,
    });
    teamSeasonsStore.createIndex("tid, season", ["tid", "season"], {
        unique: false,
    });
    teamStatsStore.createIndex("season, tid", ["season", "tid"], {
        unique: false,
    }); // Not unique because of playoffs
    teamStatsStore.createIndex("tid", "tid", { unique: false });
};

/**
 * Migrate a league database to the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion > 0.
 * @param {number} lid Integer league ID number.
 */
const migrateLeague = (upgradeDB, lid) => {
    let upgradeMsg = `Upgrading league${lid} database from version ${
        upgradeDB.oldVersion
    } to version ${upgradeDB.version}.`;

    let slowUpgradeCalled = false;
    const slowUpgrade = () => {
        if (slowUpgradeCalled) {
            return;
        }
        slowUpgradeCalled = true;

        upgradeMsg +=
            " For large leagues, this can take several minutes or more.";
        console.log(upgradeMsg);
        logEvent({
            type: "upgrade",
            text: upgradeMsg,
            saveToDb: false,
        });
    };

    if (upgradeDB.oldVersion <= 15) {
        throw new Error(
            `League is too old to upgrade (version ${upgradeDB.oldVersion})`,
        );
    }
    if (upgradeDB.oldVersion <= 16) {
        const teamSeasonsStore = upgradeDB.createObjectStore("teamSeasons", {
            keyPath: "rid",
            autoIncrement: true,
        });
        const teamStatsStore = upgradeDB.createObjectStore("teamStats", {
            keyPath: "rid",
            autoIncrement: true,
        });

        teamSeasonsStore.createIndex("tid, season", ["tid", "season"], {
            unique: false,
        });
        teamSeasonsStore.createIndex("season, tid", ["season", "tid"], {
            unique: true,
        });
        teamStatsStore.createIndex("tid", "tid", { unique: false });
        teamStatsStore.createIndex("season, tid", ["season", "tid"], {
            unique: false,
        });

        upgradeDB.teams.iterate(t => {
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
        upgradeDB.players.iterate(p => {
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
        upgradeDB.awards.iterate(a => {
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
        upgradeDB.draftPicks.deleteIndex("season");
        upgradeDB.draftPicks.deleteIndex("tid");
        upgradeDB.playerFeats.deleteIndex("pid");
        upgradeDB.playerFeats.deleteIndex("tid");
        upgradeDB.players.deleteIndex("draft.year");
        upgradeDB.players.deleteIndex("retiredYear");
        upgradeDB.releasedPlayers.deleteIndex("tid");
        upgradeDB.releasedPlayers.deleteIndex("contract.exp");
    }
    if (upgradeDB.oldVersion <= 21) {
        upgradeDB.players.createIndex(
            "draft.year, retiredYear",
            ["draft.year", "retiredYear"],
            { unique: false },
        );
        upgradeDB.players.iterate(p => {
            if (p.retiredYear === null || p.retiredYear === undefined) {
                p.retiredYear = Infinity;
                upgradeDB.players.put(p);
            }
        });
    }
    if (upgradeDB.oldVersion <= 22) {
        upgradeDB.createObjectStore("draftLotteryResults", {
            keyPath: "season",
        });
    }
    if (upgradeDB.oldVersion <= 23) {
        upgradeDB.players.iterate(p => {
            for (const r of p.ratings) {
                r.hgt = player.heightToRating(p.hgt);
            }
            upgradeDB.players.put(p);
        });
    }
    if (upgradeDB.oldVersion <= 24) {
        upgradeDB.teamStats.iterate(ts => {
            ts.oppBlk = ts.ba;
            delete ts.ba;
            upgradeDB.teamStats.put(ts);
        });
    }
    if (upgradeDB.oldVersion <= 25) {
        upgradeDB.games.iterate(gm => {
            for (const t of gm.teams) {
                delete t.trb;
                for (const p of t.players) {
                    delete p.trb;
                }
            }
            upgradeDB.games.put(gm);
        });
        upgradeDB.playerStats.iterate(ps => {
            delete ps.trb;
            upgradeDB.playerStats.put(ps);
        });
        upgradeDB.teamStats.iterate(ts => {
            delete ts.trb;
            delete ts.oppTrb;
            upgradeDB.teamStats.put(ts);
        });
    }
    if (upgradeDB.oldVersion <= 26) {
        slowUpgrade();

        // Only non-retired players, for efficiency
        upgradeDB.players.iterate(p => {
            for (const r of p.ratings) {
                // Replace blk/stl with diq
                if (typeof r.diq !== "number") {
                    if (
                        typeof r.blk === "number" &&
                        typeof r.stl === "number"
                    ) {
                        r.diq = Math.round((r.blk + r.stl) / 2);
                        delete r.blk;
                        delete r.stl;
                    } else {
                        r.diq = 50;
                    }
                }

                // Add oiq
                if (typeof r.oiq !== "number") {
                    r.oiq = Math.round((r.drb + r.pss + r.tp + r.ins) / 4);
                    if (typeof r.oiq !== "number") {
                        r.oiq = 50;
                    }
                }

                // Scale ratings
                const ratingKeys: RatingKey[] = [
                    "stre",
                    "spd",
                    "jmp",
                    "endu",
                    "ins",
                    "dnk",
                    "ft",
                    "fg",
                    "tp",
                    "oiq",
                    "diq",
                    "drb",
                    "pss",
                    "reb",
                ];
                for (const key of ratingKeys) {
                    if (typeof r[key] === "number") {
                        // 100 -> 80
                        // 0 -> 20
                        // Linear in between
                        r[key] -= 20 * (r[key] - 50) / 50;
                    } else {
                        console.log(p);
                        throw new Error(`Missing rating: ${key}`);
                    }
                }

                r.ovr = player.ovr(r);
                r.skills = player.skills(r);

                // For performance, only calculate pot for non-retired players
                if (p.tid === PLAYER.RETIRED) {
                    r.pot = r.ovr;
                } else {
                    r.pot = bootstrapPot(r, r.season - p.born.year);
                }

                if (p.draft.year === r.season) {
                    p.draft.ovr = r.ovr;
                    p.draft.skills = r.skills;
                    p.draft.pot = r.pot;
                }
            }

            upgradeDB.players.put(p);
        });
    }
    if (upgradeDB.oldVersion <= 27) {
        upgradeDB.teamSeasons.iterate(teamSeason => {
            if (typeof teamSeason.stadiumCapacity !== "number") {
                teamSeason.stadiumCapacity = 25000;
            }
            upgradeDB.teamSeasons.put(teamSeason);
        });
    }
    if (upgradeDB.oldVersion <= 28) {
        slowUpgrade();
        upgrade29(upgradeDB._dbOrTx._rawTransaction);
    }
    if (upgradeDB.oldVersion <= 29) {
        // Split old single string p.name into two names
        upgradeDB.players.iterate(p => {
            if (!Array.isArray(p.relatives)) {
                p.relatives = [];
                upgradeDB.players.put(p);
            }
        });
    }
    if (upgradeDB.oldVersion <= 30) {
        // Split old single string p.name into two names
        upgrade31(upgradeDB._dbOrTx._rawTransaction);
    }
};

const connectLeague = async (lid: number) => {
    // Would like to await on migrateLeague and inside there, but Firefox
    const db = await backboard.open(`league${lid}`, 31, upgradeDB => {
        if (upgradeDB.oldVersion === 0) {
            createLeague(upgradeDB, lid);
        } else {
            migrateLeague(upgradeDB, lid);
        }
    });

    db.on("versionchange", () => db.close());

    return db;
};

export default connectLeague;
