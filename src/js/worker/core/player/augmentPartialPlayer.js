// @flow

import { PHASE, PLAYER, g } from "../../../common";
import { player } from "../../core";
import generate from "./generate";
import { random } from "../../util";
import type { PlayerWithStats } from "../../../common/types";

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
    if (version === undefined || version < 24) {
        for (const r of p.ratings) {
            r.hgt = player.heightToRating(p.hgt);
            r.ovr = player.ovr(r);
            if (r.ovr > r.pot) {
                r.pot = r.ovr;
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
}

export default augmentPartialPlayer;
