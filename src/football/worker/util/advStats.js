// @flow

import { PHASE } from "../../../deion/common";
import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";

// Approximate Value: https://www.pro-football-reference.com/blog/indexd961.html?page_id=8061
const calculateAV = (players, teams, league) => {
    const teamOffPts = teams.map(
        t => (100 * t.stats.ptsPerDrive) / league.ptsPerDrive,
    );

    const teamPtsOL = teamOffPts.map(pts => (5 / 11) * pts);
    const teamPtsSkill = teams.map((t, i) => teamOffPts[i] - teamPtsOL[i]);
    const teamPtsRus = teams.map(
        (t, i) =>
            (teamPtsSkill[i] * 0.22 * t.stats.rusYds) /
            (t.stats.rusYds + t.stats.recYds),
    );
    const teamPtsPss = teams.map(
        (t, i) => (teamPtsSkill[i] - teamPtsRus[i]) * 0.26,
    );
    const teamPtsRec = teams.map(
        (t, i) => (teamPtsSkill[i] - teamPtsRus[i]) * 0.74,
    );

    const individualPts = players.map(p => {
        let score = 0;

        if (p.ratings.pos === "OL" || p.ratings.pos === "TE") {
            const posMultiplier = p.ratings.pos === "OL" ? 1.1 : 0.2;

            score += p.stats.gp + 5 * p.stats.gs * posMultiplier;
        }

        return score;
    });

    const teamIndividualPts = players.reduce((totals, p, i) => {
        if (p.tid >= totals.length) {
            throw new Error("Should never happen");
        }
        totals[p.tid] += individualPts[i];
        return totals;
    }, Array(teams.length).fill(0));

    const av = players.map((p, i) => {
        let score = 0;

        const t = teams[p.tid];
        if (t === undefined) {
            throw new Error("Should never happen");
        }

        // OL
        if (p.ratings.pos === "OL" || p.ratings.pos === "TE") {
            score +=
                (individualPts[i] / teamIndividualPts[p.tid]) *
                teamPtsOL[p.tid];
        }

        // Rushing
        score += (p.stats.rusYds / t.stats.rusYds) * teamPtsRus[p.tid];
        if (p.stats.rus >= 200) {
            if (p.stats.rusYdsPerAtt > league.rusYdsPerAtt) {
                score += 0.75 * (p.stats.rusYdsPerAtt - league.rusYdsPerAtt);
            } else {
                score -= 2 * (p.stats.rusYdsPerAtt - league.rusYdsPerAtt);
            }
        }

        // Receiving
        score += (p.stats.recYds / t.stats.recYds) * teamPtsRec[p.tid];
        if (p.stats.rec >= 70) {
            if (p.stats.recYdsPerAtt > league.recYdsPerAtt) {
                score += 0.5 * (p.stats.recYdsPerAtt - league.recYdsPerAtt);
            } else {
                score -= 2 * (p.stats.recYdsPerAtt - league.recYdsPerAtt);
            }
        }

        // Passing
        score += (p.stats.pssYds / t.stats.pssYds) * teamPtsPss[p.tid];
        if (p.stats.pss >= 400) {
            if (p.stats.pssYdsPerAtt > league.pssYdsPerAtt) {
                score += 0.5 * (p.stats.pssYdsPerAtt - league.pssYdsPerAtt);
            } else {
                score -= 2 * (p.stats.pssYdsPerAtt - league.pssYdsPerAtt);
            }
        }

        return score;
    });

    return {
        av,
    };
};

const advStats = async () => {
    const playersRaw = await idb.cache.players.indexGetAll("playersByTid", [
        0, // Active players have tid >= 0
        Infinity,
    ]);
    const players = await idb.getCopies.playersPlus(playersRaw, {
        attrs: ["pid", "tid"],
        stats: [
            "gp",
            "gs",
            "pss",
            "pssYds",
            "pssYdsPerAtt",
            "rus",
            "rusYds",
            "rusYdsPerAtt",
            "rec",
            "recYds",
            "recYdsPerAtt",
        ],
        ratings: ["pos"],
        season: g.season,
        playoffs: PHASE.PLAYOFFS === g.phase,
        regularSeason: PHASE.PLAYOFFS !== g.phase,
    });

    const teamStats = [
        "ptsPerDrive",
        "pts",
        "drives",
        "pss",
        "pssYds",
        "rus",
        "rusYds",
        "rec",
        "recYds",
    ];
    const teams = await idb.getCopies.teamsPlus({
        attrs: ["tid"],
        stats: teamStats,
        season: g.season,
        playoffs: PHASE.PLAYOFFS === g.phase,
        regularSeason: PHASE.PLAYOFFS !== g.phase,
    });

    const league = teams.reduce((memo, t) => {
        for (const key of teamStats) {
            if (memo.hasOwnProperty(key)) {
                memo[key] += t.stats[key];
            } else {
                memo[key] = t.stats[key];
            }
        }
        return memo;
    }, {});
    league.ptsPerDrive = league.pts / league.drives;
    league.pssYdsPerAtt = league.pssYds / league.pss;
    league.rusYdsPerAtt = league.rusYds / league.rus;
    league.recYdsPerAtt = league.recYds / league.rec;

    const updatedStats = Object.assign({}, calculateAV(players, teams, league));

    // Save to database
    const keys = Object.keys(updatedStats);
    await Promise.all(
        players.map(async ({ pid }, i) => {
            const p = playersRaw.find(p2 => p2.pid === pid);
            if (p) {
                const ps = p.stats[p.stats.length - 1];
                if (ps) {
                    for (const key of keys) {
                        if (!Number.isNaN(updatedStats[key][i])) {
                            ps[key] = updatedStats[key][i];
                        }
                    }
                    await idb.cache.players.put(p);
                }
            }
        }),
    );
};

export default advStats;
