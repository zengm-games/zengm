// @flow

import faces from "facesjs";
import { PLAYER, g, helpers } from "../../../common";
import { player } from "../../core";
import genFuzz from "./genFuzz";
import { random } from "../../util";
import type { PlayerRatings, PlayerWithoutPid } from "../../../common/types";

const typeFactors: {
    ['point' | 'wing' | 'big']: {
        [key: string]: number,
    },
} = {
    point: {
        jmp: 1.5,
        spd: 1.5,
        drb: 1.5,
        pss: 1.5,
    },
    wing: {
        jmp: 1.25,
        fg: 1.25,
        tp: 1.25,
    },
    big: {
        ins: 1.5,
        dnk: 1.5,
        reb: 1.5,
        fg: 0.75,
        tp: 0.75,
    },
};

/**
 * Generate initial ratings for a newly-created player.
 *
 * @param {number} baseRating [description]
 * @param {number} season [description]
 * @param {number} scoutingRank Between 1 and g.numTeams (default 30), the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
 * @param {number} tid [description]
 * @return {Object} Ratings object
 */
const genRatings = (
    season: number,
    scoutingRank: number,
    tid: number,
    hgt: number,
): PlayerRatings => {
    // Pick type of player (point, wing, or big) based on height
    const randType = Math.random();
    let type;
    if (hgt >= 59) {
        // 6'10" or taller
        if (randType < 0.01) {
            type = 'point';
        } else if (randType < 0.05) {
            type = 'wing';
        } else {
            type = 'big';
        }
    } else if (hgt <= 33) {
        // 6'3" or shorter
        if (randType < 0.1) {
            type = 'wing';
        } else {
            type = 'point';
        }
    } else {
        // eslint-disable-next-line no-lonely-if
        if (randType < 0.03) {
            type = 'point';
        } else if (randType < 0.3) {
            type = 'big';
        } else {
            type = 'wing';
        }
    }

    // Tall players are less talented, and all tend towards dumb and can't shoot because they are rookies
    const rawRatings = {
        stre: 30,
        spd: 30,
        jmp: 30,
        endu: 20,
        ins: 20,
        dnk: 20,
        ft: 20,
        fg: 20,
        tp: 20,
        oiq: 10,
        diq: 10,
        drb: 30,
        pss: 30,
        reb: 30,
    };

    const factor = helpers.bound(random.realGauss(1, 0.2), 0.5, 2); // For correlation across ratings, to ensure some awesome players
    for (const key of Object.keys(rawRatings)) {
        const typeFactor = typeFactors[type].hasOwnProperty(key) ? typeFactors[type][key] : 1;
        rawRatings[key] = player.limitRating(
            factor * typeFactor * random.realGauss(rawRatings[key], 3),
        );
    }

    // Small chance of freakish ability in 2 categories
    /*for (let i = 0; i < 2; i++) {
        if (Math.random() < 0.2) {
            const key = random.choice(Object.keys(rawRatings));
            rawRatings[key] = player.limitRating(rawRatings[key] + random.realGauss(20, 5));
        }
    }*/

    const ratings = {
        stre: rawRatings.stre,
        spd: rawRatings.spd,
        jmp: rawRatings.jmp,
        endu: rawRatings.endu,
        ins: rawRatings.ins,
        dnk: rawRatings.dnk,
        ft: rawRatings.ft,
        fg: rawRatings.fg,
        tp: rawRatings.tp,
        oiq: rawRatings.oiq,
        diq: rawRatings.diq,
        drb: rawRatings.drb,
        pss: rawRatings.pss,
        reb: rawRatings.reb,
        hgt,
        fuzz: genFuzz(scoutingRank),
        ovr: 0,
        pos: "F",
        pot: 0,
        season,
        skills: [],
    };

    // Ugly hack: Tall people can't dribble/pass very well
    /*if (ratings.hgt > 40) {
        ratings.drb = player.limitRating(ratings.drb - (ratings.hgt - 40));
        ratings.pss = player.limitRating(ratings.pss - (ratings.hgt - 40));
    } else {
        ratings.drb = player.limitRating(ratings.drb + 10);
        ratings.pss = player.limitRating(ratings.pss + 10);
    }*/

    if (tid === PLAYER.UNDRAFTED_2) {
        ratings.fuzz *= Math.sqrt(2);
    } else if (tid === PLAYER.UNDRAFTED_3) {
        ratings.fuzz *= 2;
    }

    ratings.pos = player.pos(ratings);

    return ratings;
};

const MIN_WEIGHT = 155;
const MAX_WEIGHT = 305;

const generate = (
    tid: number,
    age: number,
    baseRating: number,
    draftYear: number,
    newLeague: boolean,
    scoutingRank: number,
): PlayerWithoutPid => {
    // RealHeight is drawn from a custom probability distribution and then offset by a fraction of an inch either way
    let realHeight = Math.random() - 0.5; // Fraction of an inch
    realHeight += random.heightDist();

    const wingspanAdjust = realHeight + random.randInt(-1, 1);

    // hgt 0-100 corresponds to height 5'6" to 7'9" (Anything taller or shorter than the extremes will just get 100/0)
    const predetHgt = player.heightToRating(wingspanAdjust);
    realHeight = Math.round(realHeight);

    let ratings;
    if (newLeague) {
        // Create player for new league
        ratings = genRatings(g.startingSeason, scoutingRank, tid, predetHgt);
    } else {
        // Create player to be drafted
        ratings = genRatings(draftYear, scoutingRank, tid, predetHgt);
    }

    const nameInfo = player.name();

    const p = {
        awards: [],
        born: {
            year: g.season - age,
            loc: nameInfo.country,
        },
        college: "",
        contract: {
            // Will be set by setContract below
            amount: 0,
            exp: 0,
        },
        draft: {
            round: 0,
            pick: 0,
            tid: -1,
            originalTid: -1,
            year: draftYear,
            pot: 0,
            ovr: 0,
            skills: [],
        },
        face: faces.generate(),
        firstName: nameInfo.firstName,
        freeAgentMood: Array(g.numTeams).fill(0),
        gamesUntilTradable: 0,
        hgt: realHeight,
        hof: false,
        imgURL: "", // Custom rosters can define player image URLs to be used rather than vector faces
        injury: { type: "Healthy", gamesRemaining: 0 },
        lastName: nameInfo.lastName,
        ptModifier: 1,
        ratings: [ratings],
        retiredYear: Infinity,
        rosterOrder: 666, // Will be set later
        salaries: [],
        statsTids: [],
        tid,
        watch: false,
        weight: Math.round(
            random.randInt(-20, 20) +
                (ratings.hgt + 0.5 * ratings.stre) *
                    (MAX_WEIGHT - MIN_WEIGHT) /
                    150 +
                MIN_WEIGHT,
        ), // Weight in pounds (from minWeight to maxWeight)
        yearsFreeAgent: 0,

        // These should be set by player.updateValues after player is completely done (automatic in player.develop)
        value: 0,
        valueNoPot: 0,
        valueFuzz: 0,
        valueNoPotFuzz: 0,
        valueWithContract: 0,
    };

    player.setContract(p, player.genContract(p), false);

    return p;
};

export default generate;
