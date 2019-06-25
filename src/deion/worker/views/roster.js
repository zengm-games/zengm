// @flow

import { PHASE } from "../../common";
import { season, team } from "../core";
import { idb } from "../db";
import { g, overrides } from "../util";
import type { UpdateEvents } from "../../common/types";

const footballScore = p => {
    const ind = overrides.common.constants.POSITIONS.indexOf(p.ratings.pos);
    return (
        (overrides.common.constants.POSITIONS.length - ind) * 1000 +
        p.ratings.ovr
    );
};

async function updateRoster(
    inputs: { abbrev: string, season: number, tid: number },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("watchList") ||
        (inputs.season === g.season &&
            (updateEvents.includes("gameSim") ||
                updateEvents.includes("playerMovement") ||
                updateEvents.includes("newPhase"))) ||
        inputs.abbrev !== state.abbrev ||
        inputs.season !== state.season
    ) {
        const stats =
            process.env.SPORT === "basketball"
                ? ["gp", "min", "pts", "trb", "ast", "per"]
                : ["gp", "keyStats", "av"];

        const editable =
            inputs.season === g.season &&
            inputs.tid === g.userTid &&
            process.env.SPORT === "basketball";
        const showRelease =
            inputs.season === g.season && inputs.tid === g.userTid;

        const vars: any = {
            abbrev: inputs.abbrev,
            currentSeason: g.season,
            editable,
            maxRosterSize: g.maxRosterSize,
            numConfs: g.confs.length,
            numPlayoffRounds: g.numGamesPlayoffSeries.length,
            phase: g.phase,
            salaryCap: g.salaryCap / 1000,
            season: inputs.season,
            showRelease,
            showTradeFor:
                inputs.season === g.season && inputs.tid !== g.userTid,
            stats,
            userTid: g.userTid,
        };

        const seasonAttrs = ["profit", "won", "lost", "playoffRoundsWon"];
        if (g.ties) {
            seasonAttrs.push("tied");
        }

        vars.t = await idb.getCopy.teamsPlus({
            season: inputs.season,
            tid: inputs.tid,
            attrs: ["tid", "region", "name", "strategy", "imgURL"],
            seasonAttrs,
        });

        const attrs = [
            "pid",
            "tid",
            "draft",
            "name",
            "age",
            "contract",
            "cashOwed",
            "rosterOrder",
            "injury",
            "ptModifier",
            "watch",
            "untradable",
            "hof",
        ]; // tid and draft are used for checking if a player can be released without paying his salary
        const ratings = ["ovr", "pot", "dovr", "dpot", "skills", "pos"];
        const stats2 = [...stats, "yearsWithTeam"];

        if (inputs.season === g.season) {
            // Show players currently on the roster
            let [schedule, players] = await Promise.all([
                season.getSchedule(),
                idb.cache.players.indexGetAll("playersByTid", inputs.tid),
            ]);
            const payroll = await team.getPayroll(inputs.tid);

            // numGamesRemaining doesn't need to be calculated except for g.userTid, but it is.
            let numGamesRemaining = 0;
            for (let i = 0; i < schedule.length; i++) {
                if (
                    inputs.tid === schedule[i].homeTid ||
                    inputs.tid === schedule[i].awayTid
                ) {
                    numGamesRemaining += 1;
                }
            }

            players = await idb.getCopies.playersPlus(players, {
                attrs,
                ratings,
                stats: stats2,
                season: inputs.season,
                tid: inputs.tid,
                showNoStats: true,
                showRookies: true,
                fuzz: true,
                numGamesRemaining,
            });
            if (process.env.SPORT === "basketball") {
                players.sort((a, b) => a.rosterOrder - b.rosterOrder);
            } else {
                players.sort((a, b) => footballScore(b) - footballScore(a));
            }

            for (let i = 0; i < players.length; i++) {
                // Can release from user's team, except in playoffs because then no free agents can be signed to meet the minimum roster requirement
                if (
                    inputs.tid === g.userTid &&
                    (g.phase !== PHASE.PLAYOFFS ||
                        players.length > g.maxRosterSize) &&
                    !g.gameOver &&
                    players.length > 5
                ) {
                    players[i].canRelease = true;
                } else {
                    players[i].canRelease = false;
                }

                // Convert ptModifier to string so it doesn't cause unneeded knockout re-rendering
                players[i].ptModifier = String(players[i].ptModifier);
            }

            vars.players = players;
            vars.payroll = payroll / 1000;
        } else {
            // Show all players with stats for the given team and year
            // Needs all seasons because of YWT!
            let players = await idb.getCopies.players({ statsTid: inputs.tid });
            players = await idb.getCopies.playersPlus(players, {
                attrs,
                ratings,
                stats: stats2,
                season: inputs.season,
                tid: inputs.tid,
                fuzz: true,
            });
            if (process.env.SPORT === "basketball") {
                players.sort(
                    (a, b) =>
                        b.stats.gp * b.stats.min - a.stats.gp * a.stats.min,
                );
            } else {
                players.sort((a, b) => footballScore(b) - footballScore(a));
            }

            for (let i = 0; i < players.length; i++) {
                players[i].canRelease = false;
            }

            vars.players = players;
            vars.payroll = undefined;
        }

        return vars;
    }
}

export default {
    runBefore: [updateRoster],
};
