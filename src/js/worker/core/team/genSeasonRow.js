// @flow

import { g, random } from "../../util";
import type { TeamSeason } from "../../../common/types";

const genSeasonRow = (tid: number, prevSeason?: TeamSeason): TeamSeason => {
    const newSeason = {
        tid,
        season: g.season,
        gp: 0,
        gpHome: 0,
        att: 0,
        cash: 10000,
        won: 0,
        lost: 0,
        wonHome: 0,
        lostHome: 0,
        wonAway: 0,
        lostAway: 0,
        wonDiv: 0,
        lostDiv: 0,
        wonConf: 0,
        lostConf: 0,
        lastTen: [],
        streak: 0,
        playoffRoundsWon: -1, // -1: didn't make playoffs. 0: lost in first round. ... N: won championship
        hype: Math.random(),
        pop: 0, // Needs to be set somewhere!
        stadiumCapacity: 25000,
        revenues: {
            luxuryTaxShare: {
                amount: 0,
                rank: 15.5,
            },
            merch: {
                amount: 0,
                rank: 15.5,
            },
            sponsor: {
                amount: 0,
                rank: 15.5,
            },
            ticket: {
                amount: 0,
                rank: 15.5,
            },
            nationalTv: {
                amount: 0,
                rank: 15.5,
            },
            localTv: {
                amount: 0,
                rank: 15.5,
            },
        },
        expenses: {
            salary: {
                amount: 0,
                rank: 15.5,
            },
            luxuryTax: {
                amount: 0,
                rank: 15.5,
            },
            minTax: {
                amount: 0,
                rank: 15.5,
            },
            scouting: {
                amount: 0,
                rank: 15.5,
            },
            coaching: {
                amount: 0,
                rank: 15.5,
            },
            health: {
                amount: 0,
                rank: 15.5,
            },
            facilities: {
                amount: 0,
                rank: 15.5,
            },
        },
        payrollEndOfSeason: -1,
    };

    if (prevSeason) {
        // New season, carrying over some values from the previous season
        newSeason.pop = prevSeason.pop * random.uniform(0.98, 1.02); // Mean population should stay constant, otherwise the economics change too much
        newSeason.stadiumCapacity = prevSeason.stadiumCapacity;
        newSeason.hype = prevSeason.hype;
        newSeason.cash = prevSeason.cash;
    }

    return newSeason;
};

export default genSeasonRow;
