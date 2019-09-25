// @flow

import { PHASE } from "../../../common";
import { saveAwardsByPlayer } from "../season/awards";
import { idb } from "../../db";
import { g, helpers, logEvent } from "../../util";
import type { Conditions, Game, GameResults } from "../../../common/types";

const allStarMVP = async (game: Game, conditions: Conditions) => {
    let mvp;
    let maxScore = -Infinity;

    // Find MVP
    for (const t of game.teams) {
        const wonBonus = game.won.tid === t.tid ? 8 : 0;
        for (const p of t.players) {
            const score = helpers.gameScore(p) + p.pts / 2 + wonBonus;
            if (score > maxScore) {
                mvp = p;
                maxScore = score;
            }
        }
    }

    if (!mvp) {
        return;
    }

    // Save to clutchPlays (attached to ASG box score) and also store/notify normally
    const p = await idb.cache.players.get(mvp.pid); // Needed for real tid
    if (!p) {
        return;
    }
    game.clutchPlays.push(
        `<a href="${helpers.leagueUrl(["player", mvp.pid])}">${
            mvp.name
        }</a> (<a href="${helpers.leagueUrl([
            "roster",
            g.teamAbbrevsCache[p.tid],
            g.season,
        ])}">${g.teamAbbrevsCache[p.tid]}</a>) won the All-Star MVP award.`,
    );
    await saveAwardsByPlayer(
        [
            {
                pid: mvp.pid,
                tid: p.tid,
                name: mvp.name,
                type: "All-Star MVP",
            },
        ],
        conditions,
    );
};

const writeGameStats = async (
    results: GameResults,
    att: number,
    conditions: Conditions,
) => {
    const gameStats = {
        gid: results.gid,
        att,
        clutchPlays: [],
        season: g.season,
        playoffs: g.phase === PHASE.PLAYOFFS,
        overtimes: results.overtimes,
        won: {},
        lost: {},
        scoringSummary: results.scoringSummary,
        teams: [{}, {}],
    };
    gameStats.teams[0].tid = results.team[0].id;
    gameStats.teams[0].players = [];
    gameStats.teams[1].tid = results.team[1].id;
    gameStats.teams[1].players = [];

    const allStarGame = results.team[0].id === -1 && results.team[1].id === -2;

    for (let t = 0; t < 2; t++) {
        for (const key of Object.keys(results.team[t].stat)) {
            gameStats.teams[t][key] = results.team[t].stat[key];
        }

        for (let p = 0; p < results.team[t].player.length; p++) {
            gameStats.teams[t].players[p] = {};
            for (const key of Object.keys(results.team[t].player[p].stat)) {
                gameStats.teams[t].players[p][key] =
                    results.team[t].player[p].stat[key];
            }
            gameStats.teams[t].players[p].name = results.team[t].player[p].name;
            gameStats.teams[t].players[p].pos = results.team[t].player[p].pos;
            gameStats.teams[t].players[p].pid = results.team[t].player[p].id;
            gameStats.teams[t].players[p].skills = helpers.deepCopy(
                results.team[t].player[p].skills,
            );
            gameStats.teams[t].players[p].injury = helpers.deepCopy(
                results.team[t].player[p].injury,
            );
        }
    }

    // Store some extra junk to make box scores easy
    const [tw, tl] =
        results.team[0].stat.pts > results.team[1].stat.pts ? [0, 1] : [1, 0];

    gameStats.won.tid = results.team[tw].id;
    gameStats.lost.tid = results.team[tl].id;
    gameStats.won.pts = results.team[tw].stat.pts;
    gameStats.lost.pts = results.team[tl].stat.pts;

    const tied = results.team[0].stat.pts === results.team[1].stat.pts;

    // Event log
    if (results.team[0].id === g.userTid || results.team[1].id === g.userTid) {
        let text;
        if (tied) {
            const otherTid =
                results.team[0].id === g.userTid
                    ? results.team[1].id
                    : results.team[0].id;
            text = `<span style="color: yellow; font-weight: bold; padding-right: 8px">T</span> Your team tied the <a href="${helpers.leagueUrl(
                ["roster", g.teamAbbrevsCache[otherTid], g.season],
            )}">${g.teamNamesCache[otherTid]}`;
        } else if (results.team[tw].id === g.userTid) {
            text = `<span style="color: green; font-weight: bold; padding-right: 3px">W</span> Your team defeated the <a href="${helpers.leagueUrl(
                ["roster", g.teamAbbrevsCache[results.team[tl].id], g.season],
            )}">${g.teamNamesCache[results.team[tl].id]}`;
        } else {
            text = `<span style="color: red; font-weight: bold; padding-right: 8px">L</span> Your team lost to the <a href="${helpers.leagueUrl(
                ["roster", g.teamAbbrevsCache[results.team[tw].id], g.season],
            )}">${g.teamNamesCache[results.team[tw].id]}`;
        }
        text += `</a> <a href="${helpers.leagueUrl([
            "game_log",
            g.teamAbbrevsCache[g.userTid],
            g.season,
            results.gid,
        ])}">${results.team[tw].stat.pts}-${results.team[tl].stat.pts}</a>.`;

        let type = results.team[tw].id === g.userTid ? "gameWon" : "gameLost";
        if (tied) {
            type = "gameTied";
        }
        logEvent(
            {
                type,
                text,
                saveToDb: false,
                tids: [results.team[0].id, results.team[1].id],
            },
            conditions,
        );
    }

    for (const clutchPlay of results.clutchPlays) {
        // We want text at the beginning, because adding game information is redundant when attached to the box score
        gameStats.clutchPlays.push(`${clutchPlay.text}.`);

        const indTeam = clutchPlay.tids[0] === results.team[0].id ? 0 : 1;
        const indOther = indTeam === 0 ? 1 : 0;

        const won = indTeam === tw;
        const score = won
            ? `${results.team[indTeam].stat.pts}-${results.team[indOther].stat.pts}`
            : `${results.team[indOther].stat.pts}-${results.team[indTeam].stat.pts}`;

        const endPart = allStarGame
            ? `${won ? "win" : "loss"} in the All-Star Game`
            : `${won ? "win over" : "loss to"} the ${
                  g.teamNamesCache[results.team[indOther].id]
              }`;

        clutchPlay.text += ` in ${
            results.team[indTeam].stat.pts.toString().charAt(0) === "8"
                ? "an"
                : "a"
        } <a href="${helpers.leagueUrl([
            "game_log",
            g.teamAbbrevsCache[results.team[indTeam].id],
            g.season,
            results.gid,
        ])}">${score}</a> ${endPart}.`;

        logEvent(
            {
                type: "playerFeat",
                ...clutchPlay,
            },
            conditions,
        );
    }

    if (allStarGame) {
        await allStarMVP(gameStats, conditions);
    }

    await idb.cache.games.add(gameStats);
};

export default writeGameStats;
