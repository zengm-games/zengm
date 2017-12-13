// @flow

import { PLAYER, g, helpers } from "../../../common";
import { idb } from "../../db";
import { logEvent } from "../../util";
import type { Conditions, PlayerFiltered, TeamFiltered } from "../../../common/types";

type AwardsByPlayer = {
    pid: number,
    tid: number,
    name: string,
    type: string,
}[];

const getPlayers = async () => {
    let players: any = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.FREE_AGENT,
        Infinity,
    ]);
    players = await idb.getCopies.playersPlus(players, {
        attrs: ["pid", "name", "tid", "abbrev", "draft"],
        stats: [
            "gp",
            "gs",
            "min",
            "pts",
            "trb",
            "ast",
            "blk",
            "stl",
            "per",
            "ewa",
            "ws",
            "dws",
            "ws48",
            "season",
        ],
    });

    // Only keep players who actually have a stats entry for the latest season
    players = players.filter(
        p =>
            p.stats.length > 0 &&
            p.stats[p.stats.length - 1].season === g.season,
    );

    // For convenience later
    for (const p of players) {
        p.currentStats = p.stats[p.stats.length - 1];
    }

    return players;
};

const teamAwards = (teamsUnsorted: TeamFiltered[]) => {
    const teams = helpers.orderByWinp(teamsUnsorted);

    if (teams.length === 0) {
        throw new Error("No teams found");
    }

    const bestRecord = {
        tid: teams[0].tid,
        abbrev: teams[0].abbrev,
        region: teams[0].region,
        name: teams[0].name,
        won: teams[0].seasonAttrs.won,
        lost: teams[0].seasonAttrs.lost,
    };

    const bestRecordConfs = g.confs.map(c => {
        const t = teams.find(t2 => t2.cid === c.cid);

        if (!t) {
            throw new Error(`No team found with conference ID ${c.cid}`);
        }

        return {
            tid: t.tid,
            abbrev: t.abbrev,
            region: t.region,
            name: t.name,

            // Flow can't handle complexity of idb.getCopies.teams
            won: t.seasonAttrs ? t.seasonAttrs.won : 0,
            lost: t.seasonAttrs ? t.seasonAttrs.lost : 0,
        };
    });

    return { bestRecord, bestRecordConfs };
};

const leagueLeaders = (players: PlayerFiltered[], awardsByPlayer: AwardsByPlayer) => {
    const factor = g.numGames / 82 * Math.sqrt(g.quarterLength / 12); // To handle changes in number of games and playing time
    const categories = [
        { name: "League Scoring Leader", stat: "pts", minValue: 1400 },
        { name: "League Rebounding Leader", stat: "trb", minValue: 800 },
        { name: "League Assists Leader", stat: "ast", minValue: 400 },
        { name: "League Steals Leader", stat: "stl", minValue: 125 },
        { name: "League Blocks Leader", stat: "blk", minValue: 100 },
    ];
    for (const cat of categories) {
        players.sort(
            (a, b) => b.currentStats[cat.stat] - a.currentStats[cat.stat],
        );
        for (const p of players) {
            if (
                p.currentStats[cat.stat] * p.currentStats.gp >=
                    cat.minValue * factor ||
                p.currentStats.gp >= 70 * factor
            ) {
                awardsByPlayer.push({
                    pid: p.pid,
                    tid: p.tid,
                    name: p.name,
                    type: cat.name,
                });
                break;
            }
        }
    }
};

const saveAwardsByPlayer = async (awardsByPlayer: AwardsByPlayer) => {
    const pids = Array.from(new Set(awardsByPlayer.map(award => award.pid)));

    await Promise.all(
        pids.map(async pid => {
            const p = await idb.cache.players.get(pid);

            for (let i = 0; i < awardsByPlayer.length; i++) {
                if (p.pid === awardsByPlayer[i].pid) {
                    p.awards.push({
                        season: g.season,
                        type: awardsByPlayer[i].type,
                    });
                }
            }

            await idb.cache.players.put(p);
        }),
    );
};

/**
 * Compute the awards (MVP, etc) after a season finishes.
 *
 * The awards are saved to the "awards" object store.
 *
 * @memberOf core.season
 * @return {Promise}
 */
const doAwards = async (conditions: Conditions) => {
    // Careful - this array is mutated in various functions called below
    const awardsByPlayer: AwardsByPlayer  = [];

    const teams = await idb.getCopies.teamsPlus({
        attrs: ["tid", "abbrev", "region", "name", "cid"],
        seasonAttrs: ["won", "lost", "winp", "playoffRoundsWon"],
        season: g.season,
    });
    const players = await getPlayers();

    const { bestRecord, bestRecordConfs } = teamAwards(teams);

    const awards: any = {
        bestRecord,
        bestRecordConfs,
        season: g.season,
    };

    leagueLeaders(players, awardsByPlayer);

    // Most Valuable Player
    players.sort(
        (a, b) =>
            b.currentStats.ewa +
            b.currentStats.ws -
            (a.currentStats.ewa + a.currentStats.ws),
    );
    {
        const p = players[0];
        if (p) {
            awards.mvp = {
                pid: p.pid,
                name: p.name,
                tid: p.tid,
                abbrev: p.abbrev,
                pts: p.currentStats.pts,
                trb: p.currentStats.trb,
                ast: p.currentStats.ast,
            };
            awardsByPlayer.push({
                pid: p.pid,
                tid: p.tid,
                name: p.name,
                type: "Most Valuable Player",
            });
        }
    }

    // Rookie of the Year - same sort as MVP
    const rookies = players.filter(p => {
        // This doesn't factor in players who didn't start playing right after being drafted, because currently that doesn't really happen in the game.
        return p.draft.year === g.season - 1;
    });
    {
        const p = rookies[0];
        if (p !== undefined) {
            // I suppose there could be no rookies at all.. which actually does happen when skip the draft from the debug menu
            awards.roy = {
                pid: p.pid,
                name: p.name,
                tid: p.tid,
                abbrev: p.abbrev,
                pts: p.currentStats.pts,
                trb: p.currentStats.trb,
                ast: p.currentStats.ast,
            };
            awardsByPlayer.push({
                pid: p.pid,
                tid: p.tid,
                name: p.name,
                type: "Rookie of the Year",
            });
        }
    }

    // All Rookie Team - same sort as MVP
    awards.allRookie = [];
    for (let i = 0; i < 5; i++) {
        const p = rookies[i];
        if (p) {
            awards.allRookie.push({
                pid: p.pid,
                name: p.name,
                tid: p.tid,
                abbrev: p.abbrev,
                pts: p.currentStats.pts,
                trb: p.currentStats.trb,
                ast: p.currentStats.ast,
            });
            awardsByPlayer.push({
                pid: p.pid,
                tid: p.tid,
                name: p.name,
                type: "All Rookie Team",
            });
        }
    }

    // Sixth Man of the Year - same sort as MVP, must have come off the bench in most games
    {
        const p = players.find(
            p2 =>
                p2.currentStats.gs === 0 ||
                p2.currentStats.gp / p2.currentStats.gs > 2,
        );
        if (p) {
            awards.smoy = {
                pid: p.pid,
                name: p.name,
                tid: p.tid,
                abbrev: p.abbrev,
                pts: p.currentStats.pts,
                trb: p.currentStats.trb,
                ast: p.currentStats.ast,
            };
            awardsByPlayer.push({
                pid: p.pid,
                tid: p.tid,
                name: p.name,
                type: "Sixth Man of the Year",
            });
        }
    }

    // All League Team - same sort as MVP
    awards.allLeague = [{ title: "First Team", players: [] }];
    let type = "First Team All-League";
    for (let i = 0; i < 15; i++) {
        const p = players[i];
        if (i === 5) {
            awards.allLeague.push({ title: "Second Team", players: [] });
            type = "Second Team All-League";
        } else if (i === 10) {
            awards.allLeague.push({ title: "Third Team", players: [] });
            type = "Third Team All-League";
        }
        awards.allLeague[awards.allLeague.length - 1].players.push({
            pid: p.pid,
            name: p.name,
            tid: p.tid,
            abbrev: p.abbrev,
            pts: p.currentStats.pts,
            trb: p.currentStats.trb,
            ast: p.currentStats.ast,
        });
        awardsByPlayer.push({ pid: p.pid, tid: p.tid, name: p.name, type });
    }

    // Defensive Player of the Year
    players.sort(
        (a, b) =>
            b.currentStats.dws +
            b.currentStats.blk +
            b.currentStats.stl -
            (a.currentStats.dws + a.currentStats.blk + a.currentStats.stl),
    );
    {
        const p = players[0];
        awards.dpoy = {
            pid: p.pid,
            name: p.name,
            tid: p.tid,
            abbrev: p.abbrev,
            trb: p.currentStats.trb,
            blk: p.currentStats.blk,
            stl: p.currentStats.stl,
        };
        awardsByPlayer.push({
            pid: p.pid,
            tid: p.tid,
            name: p.name,
            type: "Defensive Player of the Year",
        });
    }

    // All Defensive Team - same sort as DPOY
    awards.allDefensive = [{ title: "First Team", players: [] }];
    type = "First Team All-Defensive";
    for (let i = 0; i < 15; i++) {
        const p = players[i];
        if (i === 5) {
            awards.allDefensive.push({ title: "Second Team", players: [] });
            type = "Second Team All-Defensive";
        } else if (i === 10) {
            awards.allDefensive.push({ title: "Third Team", players: [] });
            type = "Third Team All-Defensive";
        }
        awards.allDefensive[awards.allDefensive.length - 1].players.push({
            pid: p.pid,
            name: p.name,
            tid: p.tid,
            abbrev: p.abbrev,
            trb: p.currentStats.trb,
            blk: p.currentStats.blk,
            stl: p.currentStats.stl,
        });
        awardsByPlayer.push({ pid: p.pid, tid: p.tid, name: p.name, type });
    }

    // Most Improved Player
    // No WS component because it factored in moving from a bad -> good team too much
    const mipInfos = [];
    const mipFactor = g.numGames * Math.sqrt(g.quarterLength / 12);
    for (const p of players) {
        // Too many second year players get picked, when it's expected for them to improve (undrafted and second round picks can still win)
        if (p.draft.year + 2 >= g.season && p.draft.round === 1) {
            continue;
        }

        const oldStatsAll = p.stats.filter(ps => ps.season === g.season - 1);
        if (oldStatsAll.length === 0) {
            continue;
        }
        const oldStats = oldStatsAll[oldStatsAll.length - 1];

        const ewaAllPrev = p.stats.slice(0, -1).map(ps => ps.ewa);

        const mipInfo = {
            pid: p.pid,
            min: p.currentStats.min * p.currentStats.gp,
            minOld: oldStats.min * oldStats.gp,
            ewa: p.currentStats.ewa,
            ewaOld: oldStats.ewa,
            ewaMax: Math.max(...ewaAllPrev),
            per: p.currentStats.per,
            perOld: oldStats.per,
            score: 0,
        };

        // Sanity check, needed with PER
        if (mipInfo.min < 5 * mipFactor || mipInfo.minOld < 5 * mipFactor) {
            continue;
        }

        // Increasing WS by 5 is equal weight to increasing WS/48 by 0.1
        // Transltaed to PER/EWA by guessing
        mipInfo.score =
            0.02 * (mipInfo.ewa - mipInfo.ewaOld) +
            0.03 * (mipInfo.per - mipInfo.perOld);

        // Penalty - lose 0.05 for every mpg last season under 15
        if (mipInfo.minOld < 15 * mipFactor) {
            mipInfo.score -=
                0.05 * (15 * mipFactor - mipInfo.minOld / g.numGames);
        }

        // Penalty - lose additional 0.05 for every mpg last season under 10
        if (mipInfo.minOld < 15 * mipFactor) {
            mipInfo.score -=
                0.05 * (15 * mipFactor - mipInfo.minOld / g.numGames);
        }

        // Penalty - lose 0.01 for every mpg this season under 30
        if (mipInfo.min < 30 * mipFactor) {
            mipInfo.score -= 0.01 * (30 * mipFactor - mipInfo.min / g.numGames);
        }

        // Penalty - baseline required is 125% of previous best season. Lose 0.01 for every 1% below that.
        if (mipInfo.ewa < 1.25 * mipInfo.ewaMax) {
            let ratio = 1;
            if (mipInfo.ewaMax !== 0) {
                ratio = mipInfo.ewa / mipInfo.ewaMax;
            }

            // Sanity check... don't want two negative numbers blowing up the ratio
            if (ratio < 0 || (mipInfo.ewa < 0 && mipInfo.ewaMax < 0)) {
                ratio = 0;
            }

            mipInfo.score -= 1.25 - ratio;
        }

        mipInfos.push(mipInfo);
    }
    if (mipInfos.length > 0) {
        // Might be no MIP, such as in first season
        mipInfos.sort((a, b) => b.score - a.score);

        const p = players.find(p2 => p2.pid === mipInfos[0].pid);
        if (p !== undefined) {
            awards.mip = {
                pid: p.pid,
                name: p.name,
                tid: p.tid,
                abbrev: p.abbrev,
                pts: p.currentStats.pts,
                trb: p.currentStats.trb,
                ast: p.currentStats.ast,
            };
            awardsByPlayer.push({
                pid: p.pid,
                tid: p.tid,
                name: p.name,
                type: "Most Improved Player",
            });
        }
    }

    // Finals MVP - most WS in playoffs
    const champTeam = teams.find(
        t => t.seasonAttrs.playoffRoundsWon === g.numPlayoffRounds,
    );
    if (champTeam) {
        const champTid = champTeam.tid;

        let champPlayers = await idb.cache.players.indexGetAll(
            "playersByTid",
            champTid,
        ); // Alternatively, could filter original players array by tid, but still need playersPlus to fill in playoff stats
        champPlayers = await idb.getCopies.playersPlus(champPlayers, {
            // Only the champions, only playoff stats
            attrs: ["pid", "name", "tid", "abbrev"],
            stats: ["pts", "trb", "ast", "ws", "ewa"],
            season: g.season,
            playoffs: true,
            regularSeason: false,
            tid: champTid,
        });
        champPlayers.sort(
            (a, b) => b.stats.ewa + b.stats.ws - (a.stats.ewa + a.stats.ws),
        );
        {
            const p = champPlayers[0];
            awards.finalsMvp = {
                pid: p.pid,
                name: p.name,
                tid: p.tid,
                abbrev: p.abbrev,
                pts: p.stats.pts,
                trb: p.stats.trb,
                ast: p.stats.ast,
            };
            awardsByPlayer.push({
                pid: p.pid,
                tid: p.tid,
                name: p.name,
                type: "Finals MVP",
            });
        }
    }

    await idb.cache.awards.put(awards);
    await saveAwardsByPlayer(awardsByPlayer);

    // None of this stuff needs to block, it's just notifications of crap
    // Notifications for awards for user's players
    for (const p of awardsByPlayer) {
        let text = `<a href="${helpers.leagueUrl(["player", p.pid])}">${
            p.name
        }</a> (<a href="${helpers.leagueUrl([
            "roster",
            g.teamAbbrevsCache[p.tid],
            g.season,
        ])}">${g.teamAbbrevsCache[p.tid]}</a>) `;
        if (p.type.includes("Team")) {
            text += `made the ${p.type}.`;
        } else if (p.type.includes("Leader")) {
            text += `led the league in ${p.type
                .replace("League ", "")
                .replace(" Leader", "")
                .toLowerCase()}.`;
        } else {
            text += `won the ${p.type} award.`;
        }
        logEvent(
            {
                type: "award",
                text,
                showNotification:
                    p.tid === g.userTid || p.type === "Most Valuable Player",
                pids: [p.pid],
                tids: [p.tid],
            },
            conditions,
        );
    }
};

export default doAwards;
