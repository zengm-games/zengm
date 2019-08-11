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

    const teamDefPts = teams.map(t => {
        if (league.ptsPerDrive === 0) {
            return 0;
        }
        const M = t.stats.oppPtsPerDrive / league.ptsPerDrive;
        return (100 * (1 + 2 * M - M ** 2)) / (2 * M);
    });
    const teamPtsFront7 = teamDefPts.map(pts => (2 / 3) * pts);
    const teamPtsSecondary = teamDefPts.map(pts => (1 / 3) * pts);

    const defensivePositions = ["DL", "LB", "CB", "S"];
    const tckConstant = {
        DL: 0.6,
        LB: 0.3,
        CB: 0,
        S: 0,
    };
    const teamIndividualPtsOL = Array(teams.length).fill(0);
    const teamIndividualPtsFront7 = Array(teams.length).fill(0);
    const teamIndividualPtsSecondary = Array(teams.length).fill(0);
    const individualPts = players.map(p => {
        let score = 0;

        if (p.ratings.pos === "OL" || p.ratings.pos === "TE") {
            const posMultiplier = p.ratings.pos === "OL" ? 1.1 : 0.2;

            score = p.stats.gp + 5 * p.stats.gs * posMultiplier;

            teamIndividualPtsOL[p.tid] += score;
        } else if (defensivePositions.includes(p.ratings.pos)) {
            score =
                p.stats.gp +
                5 * p.stats.gs +
                p.stats.defSk +
                4 * p.stats.defFmbRec +
                4 * p.stats.defInt +
                5 * (p.stats.defIntTD + p.stats.defFmbTD) +
                tckConstant[p.ratings.pos] * p.stats.defTck;

            if (p.ratings.pos === "DL" || p.ratings.pos === "LB") {
                teamIndividualPtsFront7[p.tid] += score;
            } else {
                teamIndividualPtsSecondary[p.tid] += score;
            }
        }

        return score;
    });

    const av = players.map((p, i) => {
        let score = 0;

        const t = teams[p.tid];
        if (t === undefined) {
            throw new Error("Should never happen");
        }

        // OL
        if (p.ratings.pos === "OL" || p.ratings.pos === "TE") {
            score +=
                (individualPts[i] / teamIndividualPtsOL[p.tid]) *
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

        // Defense
        if (p.ratings.pos === "DL" || p.ratings.pos === "LB") {
            score +=
                (individualPts[i] / teamIndividualPtsFront7[p.tid]) *
                teamPtsFront7[p.tid];
        }
        if (p.ratings.pos === "S" || p.ratings.pos === "CB") {
            score +=
                (individualPts[i] / teamIndividualPtsSecondary[p.tid]) *
                teamPtsSecondary[p.tid];
        }

        // Returns
        score += p.stats.prTD + p.stats.krTD;

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
            "defSk",
            "defFmbRec",
            "defInt",
            "defIntTD",
            "defFmbTD",
            "defTck",
            "prTD",
            "krTD",
        ],
        ratings: ["pos"],
        season: g.season,
        playoffs: PHASE.PLAYOFFS === g.phase,
        regularSeason: PHASE.PLAYOFFS !== g.phase,
    });

    const teamStats = [
        "ptsPerDrive",
        "oppPtsPerDrive",
        "pts",
        "oppPts",
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

    const updatedStats = {
        ...calculateAV(players, teams, league),
    };

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
