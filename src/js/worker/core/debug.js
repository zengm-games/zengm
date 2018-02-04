// @flow

// Functions only used for debugging the game, particularly balance issues. This should not be included or loaded in the compiled version.

import backboard from "backboard";
import range from "lodash/range";
import { PLAYER, g, helpers } from "../../common";
import { draft, player } from "../core";
import { idb } from "../db";
import type { RatingKey } from "../../common/types";

// Returns the average contract for the active players in the league
// Useful to run this while playing with the contract formula in core.player.genContract
async function leagueAverageContract() {
    // All non-retired players
    const players = await idb.league.players
        .index("tid")
        .getAll(backboard.lowerBound(PLAYER.FREE_AGENT));

    let total = 0;

    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const contract = player.genContract(p);
        total += contract.amount;
    }

    console.log(total / players.length);
}

function averageCareerArc(ratingToSave: RatingKey) {
    console.log(
        'Warning: This does not include "special" draft prospects created in draft.genPlayers',
    );

    const numPlayers = 1000; // Number of players per profile
    const numSeasons = 20;

    const averageOvr = [];
    const averagePot = [];
    const averageRat = [];
    for (let i = 0; i < numSeasons; i++) {
        averageOvr[i] = 0;
        averagePot[i] = 0;
        averageRat[i] = 0;
    }

    for (let i = 0; i < numPlayers; i++) {
        const p = player.generate(0, 19, g.season, true, 15);
        for (let k = 0; k < numSeasons; k++) {
            averageOvr[k] += p.ratings[0].ovr;
            averagePot[k] += p.ratings[0].pot;
            if (ratingToSave) {
                averageRat[k] += p.ratings[0][ratingToSave];
            }
            player.develop(p, 1, true);
        }
    }

    for (let i = 0; i < numSeasons; i++) {
        averageOvr[i] /= numPlayers;
        averagePot[i] /= numPlayers;
        if (ratingToSave) {
            averageRat[i] /= numPlayers;
        }
    }

    console.log("ovr:");
    console.log(averageOvr);
    console.log("pot:");
    console.log(averagePot);
    if (ratingToSave) {
        console.log(`${ratingToSave}:`);
        console.log(averageRat);
    }
}

const maxRatingDists = (numPlayers: number = 100) => {
    // Each player gets one entry per array: their career max in a rating
    const ratings = {
        ovr: [],
        stre: [],
        spd: [],
        jmp: [],
        endu: [],
        ins: [],
        dnk: [],
        ft: [],
        fg: [],
        tp: [],
        oiq: [],
        diq: [],
        drb: [],
        pss: [],
        reb: [],
    };
    const ages = helpers.deepCopy(ratings);

    let playersToProcess = [];
    for (let i = 0; i < numPlayers; i++) {
        if (playersToProcess.length === 0) {
            const { players } = draft.genPlayersWithoutSaving(
                PLAYER.UNDRAFTED,
                15.5,
                70,
                false,
            );
            playersToProcess = players;
        }
        const p = playersToProcess.pop();

        // Log every 5%
        if (i % Math.round(numPlayers / 20) === 0) {
            console.log(`${Math.round(100 * i / numPlayers)}%`);
        }

        const maxRatings = Object.assign({}, p.ratings[0]);
        const maxAges = Object.assign({}, ages);
        for (const key of Object.keys(maxAges)) {
            maxAges[key] = g.season - p.draft.year;
        }

        for (let j = 0; j < 20; j++) {
            player.develop(p, 1, false, 15.5, true);
            p.born.year -= 1; // Aging after develop

            for (const key of Object.keys(ratings)) {
                if (p.ratings[0][key] > maxRatings[key]) {
                    maxRatings[key] = p.ratings[0][key];
                    maxAges[key] = g.season - p.born.year;
                }
            }
        }

        for (const key of Object.keys(ratings)) {
            ratings[key].push(maxRatings[key]);
            ages[key].push(maxAges[key]);
        }
    }

    const q1 = Math.floor(0.25 * numPlayers);
    const q2 = Math.floor(0.5 * numPlayers);
    const q3 = Math.floor(0.75 * numPlayers);

    console.log("Ranges are min/q1/median/q3/max");

    for (const key of Object.keys(ratings)) {
        // $FlowFixMe
        ratings[key].sort((a, b) => a - b);
        // $FlowFixMe
        ages[key].sort((a, b) => a - b);

        const ranges = [
            ratings[key][0],
            ratings[key][q1],
            ratings[key][q2],
            ratings[key][q3],
            ratings[key][ratings[key].length - 1],
        ];
        const ageRanges = [
            ages[key][0],
            ages[key][q1],
            ages[key][q2],
            ages[key][q3],
            ages[key][ratings[key].length - 1],
        ];
        const num100s = ratings[key].filter(x => x === 100).length;

        console.log(`${key}:`);
        console.log(`Max ratings: ${JSON.stringify(ranges)}`);
        console.log(`Ages of max ratings: ${JSON.stringify(ageRanges)}`);
        console.log(`Number of 100s: ${num100s}`);
        console.log("");
    }
};

const avgRatingDists = (numPlayers: number = 100) => {
    const NUM_SEASONS = 20;

    const ratings = range(NUM_SEASONS).map(() => {
        return {
            ovr: [],
            stre: [],
            spd: [],
            jmp: [],
            endu: [],
            ins: [],
            dnk: [],
            ft: [],
            fg: [],
            tp: [],
            oiq: [],
            diq: [],
            drb: [],
            pss: [],
            reb: [],
        };
    });

    let playersToProcess = [];
    for (let i = 0; i < numPlayers; i++) {
        if (playersToProcess.length === 0) {
            const { players } = draft.genPlayersWithoutSaving(
                PLAYER.UNDRAFTED,
                15.5,
                70,
                false,
            );
            playersToProcess = players;
        }
        const p = playersToProcess.pop();

        // Log every 5%
        if (i % Math.round(numPlayers / 20) === 0) {
            console.log(`${Math.round(100 * i / numPlayers)}%`);
        }

        for (let j = 0; j < NUM_SEASONS; j++) {
            player.develop(p, 1, false, 15.5, true);
            p.born.year -= 1; // Aging after develop

            for (const key of Object.keys(ratings[j])) {
                ratings[j][key].push(p.ratings[0][key]);
            }
        }
    }

    const q1 = Math.floor(0.25 * numPlayers);
    const q2 = Math.floor(0.5 * numPlayers);
    const q3 = Math.floor(0.75 * numPlayers);

    console.log("Career arc for the q1/median/q3 player");

    for (const key of Object.keys(ratings[0])) {
        const ratingsForKey = ratings.map(r => {
            // $FlowFixMe
            return r[key].sort((a, b) => a - b);
        });

        const q1s = ratingsForKey.map(row => row[q1]);
        const q2s = ratingsForKey.map(row => row[q2]);
        const q3s = ratingsForKey.map(row => row[q3]);

        console.log(`${key}:`);
        console.log(`q1: ${JSON.stringify(q1s)}`);
        console.log(`q2: ${JSON.stringify(q2s)}`);
        console.log(`q3: ${JSON.stringify(q3s)}`);
        console.log("");
    }
};

const countSkills = async () => {
    // All non-retired players
    const players = await idb.league.players
        .index("tid")
        .getAll(backboard.lowerBound(PLAYER.FREE_AGENT));

    const counts = {
        "3": 0,
        A: 0,
        B: 0,
        Di: 0,
        Dp: 0,
        Po: 0,
        Ps: 0,
        R: 0,
    };

    for (const p of players) {
        const r = p.ratings[p.ratings.length - 1];

        // Dynamically recompute, to make dev easier when changing skills formula
        const skills = player.skills(r);

        for (const skill of skills) {
            counts[skill] += 1;
        }
    }

    console.table(counts);
};

const countPositions = async () => {
    // All non-retired players
    const players = await idb.league.players
        .index("tid")
        .getAll(backboard.lowerBound(PLAYER.FREE_AGENT));

    const counts = {
        PG: 0,
        G: 0,
        SG: 0,
        GF: 0,
        SF: 0,
        F: 0,
        PF: 0,
        FC: 0,
        C: 0,
    };

    for (const p of players) {
        const r = p.ratings[p.ratings.length - 1];

        // Dynamically recompute, to make dev easier when changing position formula
        const pos = player.pos(r);

        counts[pos] += 1;
    }

    console.table(counts);
};

export default {
    leagueAverageContract,
    averageCareerArc,
    maxRatingDists,
    avgRatingDists,
    countSkills,
    countPositions,
};
