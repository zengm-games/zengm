// @flow

import faces from "facesjs";
import { PLAYER, g, helpers } from "../../../common";
import { player } from "../../core";
import genFuzz from "./genFuzz";
import { random } from "../../util";
import type { PlayerRatings, PlayerWithoutPid } from "../../../common/types";

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
    // Tall players are less talented, and all tend towards dumb and can't shoot because they are rookies
    const rawRatings = {
        stre: helpers.bound(hgt - 20, 0, 60),
        spd: 10 + helpers.bound(100 - hgt, 0, 60),
        jmp: 10 + helpers.bound(100 - hgt, 0, 60),
        endu: helpers.bound(100 - hgt, 0, 40),
        ins: helpers.bound(hgt - 20, 0, 40),
        dnk: helpers.bound(hgt - 20, 0, 40),
        ft: helpers.bound(100 - hgt, 0, 40),
        fg: helpers.bound(100 - hgt, 0, 40),
        tp: helpers.bound(100 - hgt, 0, 40),
        oiq: helpers.bound(100 - hgt, 0, 20),
        diq: 20,
        drb: helpers.bound(100 - hgt, 0, 60),
        pss: helpers.bound(100 - hgt, 0, 60),
        reb: helpers.bound(hgt - 20, 0, 60),
    };

    for (const key of Object.keys(rawRatings)) {
        rawRatings[key] = player.limitRating(random.realGauss(rawRatings[key], 3));
    }

    // Small chance of freakish ability in 2 categories
    /*for (let i = 0; i < 2; i++) {
        if (Math.random() < 0.2) {
            const key = random.choice(Object.keys(rawRatings));
            rawRatings[key] = player.limitRating(rawRatings[key] + random.realGauss(20, 5));
        }
    }*/

    const ratings = Object.assign(rawRatings, {
        hgt,
        fuzz: genFuzz(scoutingRank),
        ovr: 0,
        pos: "F",
        pot: 0,
        season,
        skills: [],
    });

    // Ugly hack: Tall people can't dribble/pass very well
    /*if (ratings.hgt > 40) {
        ratings.drb = player.limitRating(ratings.drb - (ratings.hgt - 40));
        ratings.pss = player.limitRating(ratings.pss - (ratings.hgt - 40));
    } else {
        ratings.drb = player.limitRating(ratings.drb + 10);
        ratings.pss = player.limitRating(ratings.pss + 10);
    }*/

    if (tid === PLAYER.UNDRAFTED_2) {
        ratings.fuzz *= 2;
    } else if (tid === PLAYER.UNDRAFTED_3) {
        ratings.fuzz *= 4;
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

    const wingspanAdjust = realHeight + random.randInt(-3, 3);

    // hgt 0-100 corresponds to height 5'6" to 7'9" (Anything taller or shorter than the extremes will just get 100/0)
    const predetHgt = player.heightToRating(wingspanAdjust);
    realHeight = Math.round(realHeight);

    let ratings;
    if (newLeague) {
        // Create player for new league
        ratings = genRatings(
            g.startingSeason,
            scoutingRank,
            tid,
            predetHgt,
        );
    } else {
        // Create player to be drafted
        ratings = genRatings(
            draftYear,
            scoutingRank,
            tid,
            predetHgt,
        );
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
