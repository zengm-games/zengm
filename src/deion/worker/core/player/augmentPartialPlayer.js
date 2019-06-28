// @flow

import { PHASE, PLAYER } from "../../../common";
import addStatsRow from "./addStatsRow";
import develop, { bootstrapPot } from "./develop";
import genContract from "./genContract";
import generate from "./generate";
import setContract from "./setContract";
import skills from "./skills";
import updateValues from "./updateValues";
import { g, overrides, random } from "../../util";
import type { MinimalPlayerRatings, Player } from "../../../common/types";

/**
 * Take a partial player object, such as from an uploaded JSON file, and add everything it needs to be a real player object.
 *
 * @memberOf core.player
 * @param {Object} p Partial player object.
 * @return {Object} p Full player object.
 */
const augmentPartialPlayer = (
    p: any,
    scoutingRank: number,
    version: number | void,
): Player<MinimalPlayerRatings> => {
    let age;
    if (!p.hasOwnProperty("born")) {
        age = random.randInt(19, 35);
    } else {
        age = g.startingSeason - p.born.year;
    }

    // This is used to get at default values for various attributes
    const pg = generate(p.tid, age, g.startingSeason - age, true, scoutingRank);

    // Optional things
    const simpleDefaults = [
        "awards",
        "born",
        "college",
        "draft",
        "face",
        "freeAgentMood",
        "gamesUntilTradable",
        "hgt",
        "hof",
        "imgURL",
        "injury",
        "ptModifier",
        "retiredYear",
        "rosterOrder",
        "watch",
        "weight",
        "yearsFreeAgent",
    ];
    for (let i = 0; i < simpleDefaults.length; i++) {
        if (!p.hasOwnProperty(simpleDefaults[i])) {
            p[simpleDefaults[i]] = pg[simpleDefaults[i]];
        }
    }
    if (p.retiredYear === null) {
        p.retiredYear = Infinity;
    }
    if (!p.hasOwnProperty("stats")) {
        p.stats = [];
    }
    if (!p.hasOwnProperty("statsTids")) {
        p.statsTids = [];
        if (p.tid >= 0 && g.phase <= PHASE.PLAYOFFS) {
            p.statsTids.push(p.tid);
        }
    }

    if (
        p.hasOwnProperty("name") &&
        !p.hasOwnProperty("firstName") &&
        !p.hasOwnProperty("lastName")
    ) {
        // parse and split names from roster file
        p.firstName = p.name.split(" ")[0];
        p.lastName = p.name
            .split(" ")
            .slice(1, p.name.split(" ").length)
            .join(" ");
    }

    // Fix always-missing info
    if (p.tid === PLAYER.UNDRAFTED_2) {
        p.ratings[0].season = g.startingSeason + 1;
    } else if (p.tid === PLAYER.UNDRAFTED_3) {
        p.ratings[0].season = g.startingSeason + 2;
    } else {
        if (!p.ratings[0].hasOwnProperty("season")) {
            p.ratings[0].season = g.startingSeason;
        }

        // Fix improperly-set season in ratings
        if (
            p.ratings.length === 1 &&
            p.ratings[0].season < g.startingSeason &&
            p.tid !== PLAYER.RETIRED
        ) {
            p.ratings[0].season = g.startingSeason;
        }
    }

    if (typeof p.draft.originalTid !== "number") {
        p.draft.originalTid = p.draft.tid;
    }
    if (typeof p.draft.pot !== "number") {
        p.draft.pot = 0;
    }
    if (typeof p.draft.ovr !== "number") {
        p.draft.ovr = 0;
    }
    if (!Array.isArray(p.draft.skills)) {
        p.draft.skills = [];
    }

    // Height rescaling
    if (version === undefined || version <= 23) {
        for (const r of p.ratings) {
            if (!overrides.core.player.heightToRating) {
                throw new Error("Missing overrides.core.player.heightToRating");
            }
            r.hgt = overrides.core.player.heightToRating(p.hgt);
        }
    }

    // See if we need to fix a fucked up ratings season for draft prospect
    const isUndrafted = [
        PLAYER.UNDRAFTED,
        PLAYER.UNDRAFTED_2,
        PLAYER.UNDRAFTED_3,
        PLAYER.UNDRAFTED_FANTASY_TEMP,
    ].includes(p.tid);
    const fantasyDraft =
        g.phase === PHASE.FANTASY_DRAFT && p.tid === PLAYER.UNDRAFTED;
    if (p.ratings.length === 1 && isUndrafted && !fantasyDraft) {
        const r = p.ratings[0];
        if (typeof p.draft.year === "number" && p.draft.year !== r.season) {
            r.season = p.draft.year;
        }
    }

    for (const r of p.ratings) {
        if (!r.hasOwnProperty("fuzz")) {
            r.fuzz = pg.ratings[0].fuzz;
        }
        if (!r.hasOwnProperty("skills")) {
            r.skills = skills(p.ratings[0]);
        }
        if (!r.hasOwnProperty("ovr")) {
            if (!overrides.core.player.ovr) {
                throw new Error("Missing overrides.core.player.ovr");
            }
            r.ovr = overrides.core.player.ovr(p.ratings[0]);
        }
        if (!r.hasOwnProperty("pot") || r.pot < r.ovr) {
            r.pot = bootstrapPot(r, r.season - p.born.year);
        }
    }

    // Rating rescaling
    if (version === undefined || version <= 26) {
        for (const r of p.ratings) {
            // Replace blk/stl with diq
            if (typeof r.diq !== "number") {
                if (typeof r.blk === "number" && typeof r.stl === "number") {
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
            const ratingKeys = [
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
                    r[key] -= (20 * (r[key] - 50)) / 50;
                } else {
                    console.log(p);
                    throw new Error(`Missing rating: ${key}`);
                }
            }

            if (!overrides.core.player.ovr) {
                throw new Error("Missing overrides.core.player.ovr");
            }
            r.ovr = overrides.core.player.ovr(r);
            r.skills = skills(r);
            r.pot = bootstrapPot(r, r.season - p.born.year);
            if (p.draft.year === r.season) {
                p.draft.ovr = r.ovr;
                p.draft.skills = r.skills;
                p.draft.pot = r.pot;
            }
        }
    }

    const r = p.ratings[p.ratings.length - 1];
    if (process.env.SPORT === "football" && (!r.ovrs || !r.pots)) {
        // Kind of hacky... impose ovrs/pots, but only for latest season. This will also overwrite ovr, pot, and skills
        develop(p, 0);
    }

    // Handle old format position
    if (p.hasOwnProperty("pos")) {
        for (let i = 0; i < p.ratings.length; i++) {
            if (!p.ratings[i].hasOwnProperty("pos")) {
                p.ratings[i].pos = p.pos;
            }
        }
    }
    // Don't delete p.pos because it is used as a marker that this is from a league file and we shouldn't automatically change pos over time

    updateValues(p);

    if (!p.hasOwnProperty("salaries")) {
        p.salaries = [];
    }

    if (!p.hasOwnProperty("contract")) {
        setContract(p, genContract(p, true), true);
    } else {
        // Don't let imported contracts be created for below the league minimum, and round to nearest $10,000.
        p.contract.amount = Math.max(
            10 * Math.round(p.contract.amount / 10),
            g.minContract,
        );

        if (p.contract.exp < g.startingSeason) {
            p.contract.exp = g.startingSeason;
        }

        if (p.tid >= 0 && p.salaries.length === 0) {
            setContract(p, p.contract, true);
        }
    }

    // If no stats in League File, create blank stats rows for active players if necessary
    if (!Array.isArray(p.stats)) {
        p.stats = [];
    }
    if (p.stats.length === 0) {
        if (p.tid >= 0 && g.phase <= PHASE.PLAYOFFS) {
            addStatsRow(p, g.phase === PHASE.PLAYOFFS);
        }
    } else {
        for (const ps of p.stats) {
            // Could be calculated correctly if I wasn't lazy
            if (!ps.hasOwnProperty("yearsWithTeam")) {
                ps.yearsWithTeam = 1;
            }

            // If needed, set missing +/-, blocks against to 0
            if (!ps.hasOwnProperty("ba")) {
                ps.ba = 0;
            }
            if (!ps.hasOwnProperty("pm")) {
                ps.pm = 0;
            }
        }
    }

    if (!Array.isArray(p.relatives)) {
        p.relatives = [];
    }

    return p;
};

export default augmentPartialPlayer;
