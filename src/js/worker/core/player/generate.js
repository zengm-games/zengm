// @flow

import faces from "facesjs";
import { PLAYER, g } from "../../../common";
import { player } from "../../core";
import genFuzz from "./genFuzz";
import { random } from "../../util";
import type { PlayerRatings, PlayerWithoutPid } from "../../../common/types";

// Each row should sum to ~150
const profiles = [
    [10, 10, 10, 10, 10, 10, 10, 10, 10, 25, 10, 10, 10, 10, 10], // Base
    [-30, -10, 40, 20, 15, 0, 0, 10, 15, 25, 0, 30, 20, 20, 0], // Point Guard
    [10, 10, 15, 15, 0, 0, 25, 15, 15, 20, 0, 10, 15, 0, 15], // Generic Wing
    [45, 30, -15, -15, -5, 30, 30, -5, -15, -25, 30, -5, -20, -20, 30], // Big
    [10, 10, 25, 10, 0, -10, -5, 10, 20, 30, 10, 20, 10, 0, 10], // 3andD wing
    [10, 20, 30, 35, 20, 0, 25, 0, 0, 0, 10, 0, 0, 0, 0], // Raw Athletic Wing
];
const sigmas = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];

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
    pot: number,
    season: number,
    scoutingRank: number,
    tid: number,
    predeterminedHeight: number,
): PlayerRatings => {
    // Use the predetermined height to choose the profile
    let profileId;
    if (predeterminedHeight > 55 && random.randInt(0, 1000) < 999) {
        profileId = 3; // Nearly all tall guys are "Big"
    } else if (predeterminedHeight < 35 && random.randInt(0, 1000) < 999) {
        profileId = 1; // Nearly all short guys are "Point"
    } else {
        // Medium height players (plus the very few tall/short players who slip through)
        const selector = random.randInt(1, 100);
        if (selector <= 25) {
            profileId = 0; // 25% get "Base"
        } else if (selector <= 50) {
            profileId = 2; // 25% get generic "Wing"
        } else if (selector <= 75) {
            profileId = 4; // 25% get "3andD Wing"
        } else {
            profileId = 5; // 25% get "Raw Athletic Wing"
        }
    }

    baseRating = random.gauss(baseRating, 5);

    const rawRatings = [];
    for (let i = 0; i < sigmas.length; i++) {
        const rawRating = profiles[profileId][i] + baseRating;
        rawRatings[i] = player.limitRating(random.gauss(rawRating, sigmas[i]));
    }

    // Small chance of freakish ability in 2 categories
    for (let i = 0; i < 2; i++) {
        if (Math.random() < 0.2) {
            // Randomly pick a non-height rating to improve
            const j = random.randInt(1, 14);
            rawRatings[j] = player.limitRating(rawRatings[j] + 50);
        }
    }

    const ratings = {
        hgt: rawRatings[0],
        stre: rawRatings[1],
        spd: rawRatings[2],
        jmp: rawRatings[3],
        endu: rawRatings[4],
        ins: rawRatings[5],
        dnk: rawRatings[6],
        ft: rawRatings[7],
        fg: rawRatings[8],
        tp: rawRatings[9],
        oiq: rawRatings[10],
        diq: rawRatings[11],
        drb: rawRatings[12],
        pss: rawRatings[13],
        reb: rawRatings[14],

        fuzz: genFuzz(scoutingRank),
        ovr: 0,
        pos: "",
        pot,
        season,
        skills: [],
    };

    if (predeterminedHeight !== undefined && predeterminedHeight !== 0) {
        ratings.hgt = predeterminedHeight;
    }

    // Ugly hack: Tall people can't dribble/pass very well
    if (ratings.hgt > 40) {
        ratings.drb = player.limitRating(ratings.drb - (ratings.hgt - 40));
        ratings.pss = player.limitRating(ratings.pss - (ratings.hgt - 40));
    } else {
        ratings.drb = player.limitRating(ratings.drb + 10);
        ratings.pss = player.limitRating(ratings.pss + 10);
    }

    ratings.ovr = player.ovr(ratings);

    if (tid === PLAYER.UNDRAFTED_2) {
        ratings.fuzz *= 2;
    } else if (tid === PLAYER.UNDRAFTED_3) {
        ratings.fuzz *= 4;
    }

    ratings.skills = player.skills(ratings);

    ratings.pos = player.pos(ratings);

    return ratings;
};

const MIN_WEIGHT = 155;
const MAX_WEIGHT = 305;

const generate = (
    tid: number,
    age: number,
    baseRating: number,
    pot: number,
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
            pot,
            g.startingSeason,
            scoutingRank,
            tid,
            predetHgt,
        );
    } else {
        // Create player to be drafted
        ratings = genRatings(
            baseRating,
            pot,
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
            pot,
            ovr: ratings.ovr,
            skills: ratings.skills,
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
