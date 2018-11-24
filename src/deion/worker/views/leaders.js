// @flow

import { PHASE, PLAYER } from "../../common";
import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updateLeaders(
    inputs: {
        playoffs: "playoffs" | "regularSeason",
        season: number,
    },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    // Respond to watchList in case players are listed twice in different categories
    if (
        updateEvents.includes("watchList") ||
        (inputs.season === g.season && updateEvents.includes("gameSim")) ||
        inputs.season !== state.season ||
        inputs.playoffs !== state.playoffs
    ) {
        // Calculate the number of games played for each team, which is used later to test if a player qualifies as a league leader
        const teamSeasons = await idb.getCopies.teamSeasons({
            season: inputs.season,
        });
        const gps = teamSeasons.map(teamSeason => {
            if (inputs.playoffs === "playoffs") {
                if (teamSeason.gp < g.numGames) {
                    return 0;
                }
                return teamSeason.gp - g.numGames;
            }

            // Don't count playoff games
            if (teamSeason.gp > g.numGames) {
                return g.numGames;
            }
            return teamSeason.gp;
        });

        let players;
        if (g.season === inputs.season && g.phase <= PHASE.PLAYOFFS) {
            players = await idb.cache.players.indexGetAll("playersByTid", [
                PLAYER.FREE_AGENT,
                Infinity,
            ]);
        } else {
            players = await idb.getCopies.players({
                activeSeason: inputs.season,
            });
        }
        players = await idb.getCopies.playersPlus(players, {
            attrs: ["pid", "nameAbbrev", "injury", "watch"],
            ratings: ["skills"],
            stats: [
                "pts",
                "trb",
                "ast",
                "fgp",
                "tpp",
                "ftp",
                "blk",
                "stl",
                "min",
                "per",
                "ewa",
                "gp",
                "fg",
                "tp",
                "ft",
                "abbrev",
                "tid",
                "dws",
                "ows",
                "ws",
                "ws48",
            ],
            season: inputs.season,
            playoffs: inputs.playoffs === "playoffs",
            regularSeason: inputs.playoffs !== "playoffs",
        });

        const userAbbrev = helpers.getAbbrev(g.userTid);

        // minStats and minValues are the NBA requirements to be a league leader for each stat http://www.nba.com/leader_requirements.html. If any requirement is met, the player can appear in the league leaders
        const factor = (g.numGames / 82) * Math.sqrt(g.quarterLength / 12); // To handle changes in number of games and playing time
        const categories = [];
        categories.push({
            name: "Points",
            stat: "PTS",
            statProp: "pts",
            title: "Points Per Game",
            data: [],
            minStats: ["gp", "pts"],
            minValue: [70, 1400],
        });
        categories.push({
            name: "Rebounds",
            stat: "TRB",
            statProp: "trb",
            title: "Rebounds Per Game",
            data: [],
            minStats: ["gp", "trb"],
            minValue: [70, 800],
        });
        categories.push({
            name: "Assists",
            stat: "AST",
            statProp: "ast",
            title: "Assists Per Game",
            data: [],
            minStats: ["gp", "ast"],
            minValue: [70, 400],
        });
        categories.push({
            name: "Field Goal Percentage",
            stat: "FG%",
            statProp: "fgp",
            title: "Field Goal Percentage",
            data: [],
            minStats: ["fg"],
            minValue: [300],
        });
        categories.push({
            name: "Three-Pointer Percentage",
            stat: "3PT%",
            statProp: "tpp",
            title: "Three-Pointer Percentage",
            data: [],
            minStats: ["tp"],
            minValue: [55],
        });
        categories.push({
            name: "Free Throw Percentage",
            stat: "FT%",
            statProp: "ftp",
            title: "Free Throw Percentage",
            data: [],
            minStats: ["ft"],
            minValue: [125],
        });
        categories.push({
            name: "Blocks",
            stat: "BLK",
            statProp: "blk",
            title: "Blocks Per Game",
            data: [],
            minStats: ["gp", "blk"],
            minValue: [70, 100],
        });
        categories.push({
            name: "Steals",
            stat: "STL",
            statProp: "stl",
            title: "Steals Per Game",
            data: [],
            minStats: ["gp", "stl"],
            minValue: [70, 125],
        });
        categories.push({
            name: "Minutes",
            stat: "MP",
            statProp: "min",
            title: "Minutes Per Game",
            data: [],
            minStats: ["gp", "min"],
            minValue: [70, 2000],
        });
        categories.push({
            name: "Player Efficiency Rating",
            stat: "PER",
            statProp: "per",
            title: "Player Efficiency Rating",
            data: [],
            minStats: ["min"],
            minValue: [2000],
        });
        categories.push({
            name: "Estimated Wins Added",
            stat: "EWA",
            statProp: "ewa",
            title: "Estimated Wins Added",
            data: [],
            minStats: ["min"],
            minValue: [2000],
        });
        categories.push({
            name: "Win Shares / 48 Mins",
            stat: "WS/48",
            statProp: "ws48",
            title: "Win Shares Per 48 Minutes",
            data: [],
            minStats: ["min"],
            minValue: [2000],
        });
        categories.push({
            name: "Offensive Win Shares",
            stat: "OWS",
            statProp: "ows",
            title: "Offensive Win Shares",
            data: [],
            minStats: ["min"],
            minValue: [2000],
        });
        categories.push({
            name: "Defensive Win Shares",
            stat: "DWS",
            statProp: "dws",
            title: "Defensive Win Shares",
            data: [],
            minStats: ["min"],
            minValue: [2000],
        });
        categories.push({
            name: "Win Shares",
            stat: "WS",
            statProp: "ws",
            title: "Win Shares",
            data: [],
            minStats: ["min"],
            minValue: [2000],
        });

        for (const cat of categories) {
            players.sort(
                (a, b) => b.stats[cat.statProp] - a.stats[cat.statProp],
            );
            for (let j = 0; j < players.length; j++) {
                // Test if the player meets the minimum statistical requirements for this category
                let pass = false;
                for (let k = 0; k < cat.minStats.length; k++) {
                    // Everything except gp is a per-game average, so we need to scale them by games played
                    let playerValue;
                    if (cat.minStats[k] === "gp") {
                        playerValue = players[j].stats[cat.minStats[k]];
                    } else {
                        playerValue =
                            players[j].stats[cat.minStats[k]] *
                            players[j].stats.gp;
                    }

                    // Compare against value normalized for team games played
                    if (
                        playerValue >=
                        Math.ceil(
                            (cat.minValue[k] *
                                factor *
                                gps[players[j].stats.tid]) /
                                g.numGames,
                        )
                    ) {
                        pass = true;
                        break; // If one is true, don't need to check the others
                    }
                }

                if (pass) {
                    const leader = helpers.deepCopy(players[j]);
                    leader.stat = leader.stats[cat.statProp];
                    leader.abbrev = leader.stats.abbrev;
                    delete leader.stats;
                    leader.userTeam = userAbbrev === leader.abbrev;
                    cat.data.push(leader);
                }

                // Stop when we found 10
                if (cat.data.length === 10) {
                    break;
                }
            }

            delete cat.minStats;
            delete cat.minValue;
            delete cat.statProp;
        }

        return {
            categories,
            playoffs: inputs.playoffs,
            season: inputs.season,
        };
    }
}

export default {
    runBefore: [updateLeaders],
};
