// @flow

import faces from "facesjs";
import { PLAYER, g } from "../../../common";
import { player } from "../../core";
import genFuzz from "./genFuzz";
import { random } from "../../util";
import type { PlayerRatings, PlayerWithoutPid } from "../../../common/types";

// Each profile should sum to ~150
const profiles = {
    base: {
        stre: 10,
        spd: 10,
        jmp: 10,
        endu: 10,
        ins: 10,
        dnk: 10,
        ft: 10,
        fg: 10,
        tp: 25,
        oiq: 10,
        diq: 10,
        drb: 10,
        pss: 10,
        reb: 10,
    },
    pointGuard: {
        stre: -10,
        spd: 40,
        jmp: 20,
        endu: 15,
        ins: 0,
        dnk: 0,
        ft: 10,
        fg: 15,
        tp: 25,
        oiq: 30,
        diq: 0,
        drb: 20,
        pss: 20,
        reb: 0,
    },
    wing: {
        stre: 10,
        spd: 15,
        jmp: 15,
        endu: 0,
        ins: 0,
        dnk: 25,
        ft: 15,
        fg: 15,
        tp: 20,
        oiq: 10,
        diq: 10,
        drb: 15,
        pss: 0,
        reb: 15,
    },
    big: {
        stre: 30,
        spd: -15,
        jmp: -15,
        endu: -5,
        ins: 30,
        dnk: 30,
        ft: -5,
        fg: -15,
        tp: -25,
        oiq: 10,
        diq: 10,
        drb: -20,
        pss: -20,
        reb: 30,
    },
    threeAndD: {
        stre: 10,
        spd: 25,
        jmp: 10,
        endu: 0,
        ins: -10,
        dnk: -5,
        ft: 10,
        fg: 20,
        tp: 30,
        oiq: 20,
        diq: 20,
        drb: 10,
        pss: 0,
        reb: 10,
    },
    athlete: {
        stre: 20,
        spd: 30,
        jmp: 35,
        endu: 20,
        ins: 10,
        dnk: 25,
        ft: 0,
        fg: 0,
        tp: 0,
        oiq: 0,
        diq: 0,
        drb: 0,
        pss: 0,
        reb: 0,
    },
};

const profileKeys = Object.keys(profiles.base);

/**
 * Generate initial ratings for a newly-created player.
 *
 * @param {number} baseRating [description]
 * @param {number} pot [description]
 * @param {number} season [description]
 * @param {number} scoutingRank Between 1 and g.numTeams (default 30), the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
 * @param {number} tid [description]
 * @return {Object} Ratings object
 */
const genRatings = (
    baseRating: number,
    season: number,
    scoutingRank: number,
    tid: number,
    predeterminedHeight: number,
): PlayerRatings => {
    // Use the predetermined height to choose the profile
    let profile;
    if (predeterminedHeight > 55 && random.randInt(0, 1000) < 999) {
        profile = profiles.big; // Nearly all tall guys are "Big"
    } else if (predeterminedHeight < 35 && random.randInt(0, 1000) < 999) {
        profile = profiles.pointGuard; // Nearly all short guys are "Point"
    } else {
        // Medium height players (plus the very few tall/short players who slip through)
        const selector = random.randInt(1, 100);
        if (selector <= 25) {
            profile = profiles.base; // 25% get "Base"
        } else if (selector <= 50) {
            profile = profiles.wing; // 25% get generic "Wing"
        } else if (selector <= 75) {
            profile = profiles.threeAndD; // 25% get "3andD Wing"
        } else {
            profile = profiles.athlete; // 25% get "Raw Athletic Wing"
        }
    }

    baseRating = random.realGauss(baseRating, 5);

    const rawRatings = Object.assign({}, profile);
    for (const key of profileKeys) {
        rawRatings[key] = player.limitRating(random.realGauss(rawRatings[key] + baseRating, 5));
    }

    // Small chance of freakish ability in 2 categories
    for (let i = 0; i < 2; i++) {
        if (Math.random() < 0.2) {
            const key = random.choice(profileKeys);
            rawRatings[key] = player.limitRating(rawRatings[key] + random.realGauss(20, 5));
        }
    }

    const ratings = Object.assign(rawRatings, {
        hgt: predeterminedHeight,
        fuzz: genFuzz(scoutingRank),
        ovr: 0,
        pos: "F",
        pot: 0,
        season,
        skills: [],
    });

    // Ugly hack: Tall people can't dribble/pass very well
    if (ratings.hgt > 40) {
        ratings.drb = player.limitRating(ratings.drb - (ratings.hgt - 40));
        ratings.pss = player.limitRating(ratings.pss - (ratings.hgt - 40));
    } else {
        ratings.drb = player.limitRating(ratings.drb + 10);
        ratings.pss = player.limitRating(ratings.pss + 10);
    }

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
            baseRating,
            g.startingSeason,
            scoutingRank,
            tid,
            predetHgt,
        );
    } else {
        // Create player to be drafted
        ratings = genRatings(
            baseRating,
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
