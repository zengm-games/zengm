// @flow

import { PHASE } from "../../../../deion/common";
import { player } from "../../../../deion/worker/core";
import { g, helpers, overrides, random } from "../../../../deion/worker/util";
import { RATINGS, POSITION_COUNTS } from "../../../common/constants";
import type { PlayerRatings } from "../../../common/types";

const getPos = () => {
    const numPlayers = Object.values(POSITION_COUNTS).reduce((sum, val) => {
        // $FlowFixMe
        return sum + val;
    }, 0);
    const rand = Math.random() * numPlayers;
    let cumsum = 0;
    for (const [pos, count] of Object.entries(POSITION_COUNTS)) {
        // $FlowFixMe
        cumsum += count;
        if (rand < cumsum) {
            // HACK HACK HACK: Too many OLs, too few QB and S
            if (pos === "OL" || pos === "RB") {
                const rand2 = Math.random();
                if (rand2 < 0.15) {
                    return "S";
                }
            }
            if (pos === "RB") {
                const rand2 = Math.random();
                if (rand2 < 0.5) {
                    return "S";
                }
            }

            return pos;
        }
    }

    throw new Error("No position found - this should never happen!");
};

const getRatingsToBoost = (pos: string) => {
    if (pos === "QB") {
        return {
            hgt: 1,
            spd: 0.5,
            thv: 1,
            thp: 2,
            tha: 2,
            bsc: 0.25,
            elu: 0.25,
            hnd: 0.25,
            tck: -1,
            prs: -1,
            rns: -1,
        };
    }
    if (pos === "RB") {
        return {
            spd: 1,
            bsc: 1,
            elu: 1,
            rtr: 0.5,
            hnd: 0.5,
            tck: -1,
            prs: -1,
            rns: -1,
        };
    }
    if (pos === "WR") {
        return {
            hgt: 1,
            spd: 1,
            elu: 0.5,
            rtr: 1,
            hnd: 1,
            tck: -1,
            prs: -1,
            rns: -1,
        };
    }
    if (pos === "TE") {
        return {
            hgt: 1,
            stre: 0.5,
            spd: 0.5,
            elu: 0.25,
            rtr: 1,
            hnd: 0.75,
            rbk: 0.5,
            tck: -1,
            prs: -1,
            rns: -1,
        };
    }
    if (pos === "OL") {
        return {
            spd: -1.5,
            hgt: 1,
            stre: 1.25,
            rbk: 1.1,
            pbk: 1.1,
            elu: -1,
            bsc: -1,
            hnd: -1,
            tck: -1,
            prs: -1,
            rns: -1,
            rtr: -1,
        };
    }
    if (pos === "DL") {
        return {
            spd: -0.5,
            hgt: 1.5,
            stre: 1.25,
            tck: 0.25,
            prs: 1.1,
            rns: 1.1,
            elu: -1,
            bsc: -1,
            hnd: -1,
            rtr: -1,
        };
    }
    if (pos === "LB") {
        return {
            hgt: 0.5,
            stre: 0.5,
            spd: 0.25,
            pcv: 0.5,
            tck: 1.5,
            prs: 0.75,
            rns: 0.75,
            elu: -0.5,
            bsc: -1,
            hnd: -1,
            rtr: -0.75,
        };
    }
    if (pos === "CB") {
        return {
            hgt: -0.5,
            spd: 1.25,
            pcv: 1.25,
            hnd: -0.5,
            elu: -0.5,
            bsc: -0.5,
            rtr: -0.25,
        };
    }
    if (pos === "S") {
        return {
            hgt: -0.5,
            stre: 0.5,
            spd: 1,
            pcv: 1,
            tck: 0.75,
            rns: 0.5,
            hnd: -0.5,
            elu: -0.5,
            bsc: -0.5,
            rtr: -0.5,
        };
    }
    if (pos === "K") {
        return {
            kpw: 1.75,
            kac: 1.25,
            elu: -1,
            bsc: -1,
            hnd: -1,
            rtr: -1,
            tck: -1,
            prs: -1,
            rns: -1,
            rbk: -1,
            pbk: -1,
        };
    }
    if (pos === "P") {
        return {
            ppw: 1.75,
            pac: 1.25,
            elu: -1,
            bsc: -1,
            hnd: -1,
            rtr: -1,
            tck: -1,
            prs: -1,
            rns: -1,
            rbk: -1,
            pbk: -1,
        };
    }

    throw new Error(`Invalid position "${pos}"`);
};

// 5'4" to 6'10"
const heightToInches = (hgt: number) => {
    return Math.round(64 + (hgt * (82 - 64)) / 100);
};

const info = {};
const infoIn = {};
const infoOut = {};
let timeoutID;

/**
 * Generate initial ratings for a newly-created player.
 *
 * @param {number} season [description]
 * @param {number} scoutingRank Between 1 and g.numTeams (default 30), the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
 * @param {number} tid [description]
 * @return {Object} Ratings object
 */
const genRatings = (
    season: number,
    scoutingRank: number,
): { heightInInches: number, ratings: PlayerRatings } => {
    const pos = getPos();
    const rawRatings = RATINGS.reduce((ratings, rating) => {
        ratings[rating] = player.limitRating(random.truncGauss(10, 10, 0, 40));
        return ratings;
    }, {});

    const ratingsToBoost = getRatingsToBoost(pos);
    for (const [rating, factor] of Object.entries(ratingsToBoost)) {
        rawRatings[rating] = player.limitRating(
            // $FlowFixMe
            (rawRatings[rating] += factor * random.truncGauss(10, 20, 10, 30)),
        );
    }

    if (pos !== "K" && pos !== "P" && Math.random() < 0.95) {
        rawRatings.kpw = random.randInt(0, 10);
        rawRatings.kac = random.randInt(0, 10);
        rawRatings.ppw = random.randInt(0, 10);
        rawRatings.pac = random.randInt(0, 10);
    }

    if (pos === "DL") {
        rawRatings.stre = helpers.bound(rawRatings.stre, 60, Infinity);
        rawRatings.prs = helpers.bound(rawRatings.prs, 40, Infinity);
        rawRatings.rns = helpers.bound(rawRatings.rns, 40, Infinity);
    }

    if (pos === "OL") {
        rawRatings.stre = helpers.bound(rawRatings.stre, 60, Infinity);
        rawRatings.rbk = helpers.bound(rawRatings.rbk, 40, Infinity);
        rawRatings.pbk = helpers.bound(rawRatings.pbk, 40, Infinity);
    }

    if (pos === "TE") {
        rawRatings.stre = helpers.bound(rawRatings.stre, 40, Infinity);
        rawRatings.rbk = helpers.bound(rawRatings.rbk, 30, Infinity);
    }

    for (const rating of ["hgt", "spd"]) {
        rawRatings[rating] = player.limitRating(
            rawRatings[rating] + random.truncGauss(20, 10, 0, 40),
        );
    }

    rawRatings.endu = player.limitRating(
        rawRatings.endu + random.truncGauss(12.5, 10, 0, 25),
    );

    rawRatings.bsc = player.limitRating(
        rawRatings.bsc + random.truncGauss(10, 10, 0, 20),
    );

    const ratings = {
        hgt: rawRatings.hgt,
        stre: rawRatings.stre,
        spd: rawRatings.spd,
        endu: rawRatings.endu,
        thv: rawRatings.thv,
        thp: rawRatings.thp,
        tha: rawRatings.tha,
        bsc: rawRatings.bsc,
        elu: rawRatings.elu,
        rtr: rawRatings.rtr,
        hnd: rawRatings.hnd,
        rbk: rawRatings.rbk,
        pbk: rawRatings.pbk,
        pcv: rawRatings.pcv,
        tck: rawRatings.tck,
        prs: rawRatings.prs,
        rns: rawRatings.rns,
        kpw: rawRatings.kpw,
        kac: rawRatings.kac,
        ppw: rawRatings.ppw,
        pac: rawRatings.pac,
        fuzz: player.genFuzz(scoutingRank),
        ovr: 0,
        pos,
        pot: 0,
        season,
        skills: [],
        ovrs: {},
        pots: {},
    };

    // Higher fuzz for draft prospects
    if (g.phase >= PHASE.RESIGN_PLAYERS) {
        if (season === g.season + 2) {
            ratings.fuzz *= Math.sqrt(2);
        } else if (season >= g.season + 3) {
            ratings.fuzz *= 2;
        }
    } else {
        // eslint-disable-next-line
        if (season === g.season + 1) {
            ratings.fuzz *= Math.sqrt(2);
        } else if (season >= g.season + 2) {
            ratings.fuzz *= 2;
        }
    }

    if (!overrides.core.player.pos) {
        throw new Error("Missing overrides.core.player.pos");
    }
    ratings.pos = overrides.core.player.pos(ratings);
    info[`${pos}->${ratings.pos}`] =
        info[`${pos}->${ratings.pos}`] === undefined
            ? 1
            : info[`${pos}->${ratings.pos}`] + 1;
    infoIn[pos] = infoIn[pos] === undefined ? 1 : infoIn[pos] + 1;
    infoOut[ratings.pos] =
        infoOut[ratings.pos] === undefined ? 1 : infoOut[ratings.pos] + 1;

    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
        console.log(info);
        for (const pos2 of overrides.common.constants.POSITIONS) {
            if (infoIn.hasOwnProperty(pos2)) {
                console.log(pos2, infoIn[pos2], infoOut[pos2]);
            }
        }
    }, 1000);

    /*    if (pos === "DL" && ratings.pos === "LB") {
        console.log(ratings);
        debugger;
    }*/

    return {
        heightInInches: heightToInches(ratings.hgt),
        ratings,
    };
};

export default genRatings;
