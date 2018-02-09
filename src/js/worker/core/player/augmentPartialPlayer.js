// @flow

import { PHASE, PLAYER, g } from "../../../common";
import { player } from "../../core";
import { bootstrapPot } from "./develop";
import generate from "./generate";
import { random } from "../../util";
import type { RatingKey, PlayerWithStats } from "../../../common/types";

/**
 * Take a partial player object, such as from an uploaded JSON file, and add everything it needs to be a real player object.
 *
 * This doesn't add the things from player.updateValues!
 *
 * @memberOf core.player
 * @param {Object} p Partial player object.
 * @return {Object} p Full player object.
 */
const augmentPartialPlayer = (
    p: any,
    scoutingRank: number,
    version: number | void,
): PlayerWithStats => {
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
        "contract",
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
    if (!p.hasOwnProperty("salaries")) {
        p.salaries = [];
        if (p.contract.exp < g.startingSeason) {
            p.contract.exp = g.startingSeason;
        }
        if (p.tid >= 0) {
            player.setContract(p, p.contract, true);
        }
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
    if (!p.ratings[0].hasOwnProperty("fuzz")) {
        p.ratings[0].fuzz = pg.ratings[0].fuzz;
    }
    if (!p.ratings[0].hasOwnProperty("skills")) {
        p.ratings[0].skills = player.skills(p.ratings[0]);
    }
    if (!p.ratings[0].hasOwnProperty("ovr")) {
        p.ratings[0].ovr = player.ovr(p.ratings[0]);
    }
    if (p.ratings[0].pot < p.ratings[0].ovr) {
        p.ratings[0].pot = p.ratings[0].ovr;
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

    // Height rescaling
    if (version === undefined || version <= 23) {
        for (const r of p.ratings) {
            r.hgt = player.heightToRating(p.hgt);
        }
    }

    // See if we need to fix a fucked up ratings season for draft prospect
    if (
        p.ratings.length === 1 &&
        [PLAYER.UNDRAFTED, PLAYER.UNDRAFTED_2, PLAYER.UNDRAFTED_3].includes(
            p.tid,
        )
    ) {
        const r = p.ratings[0];
        if (typeof p.draft.year === "number" && p.draft.year !== r.season) {
            r.season = p.draft.year;
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
            r.pot = bootstrapPot(r, r.season - p.born.year);
            if (p.draft.year === r.season) {
                p.draft.ovr = r.ovr;
                p.draft.skills = r.skills;
                p.draft.pot = r.pot;
            }
        }
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

    return p;
};

export default augmentPartialPlayer;
