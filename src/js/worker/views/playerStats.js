import {PHASE, PLAYER} from '../../common';
import g from '../../globals';
import {getCopy, idb} from '../db';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updatePlayers(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || (inputs.season === g.season && (updateEvents.includes('gameSim') || updateEvents.includes('playerMovement'))) || inputs.abbrev !== state.abbrev || inputs.season !== state.season || inputs.statType !== state.statType || inputs.playoffs !== state.playoffs) {
        let players;
        if (g.season === inputs.season && g.phase <= PHASE.PLAYOFFS) {
            players = await idb.cache.indexGetAll('playersByTid', [PLAYER.FREE_AGENT, Infinity]);
        } else {
            // If it's not this season, get all players, because retired players could apply to the selected season
            players = await getCopy.players({activeAndRetired: true});
        }

        let tid = g.teamAbbrevsCache.indexOf(inputs.abbrev);
        if (tid < 0) { tid = undefined; } // Show all teams

        if (!tid && inputs.abbrev === "watch") {
            players = players.filter(p => p.watch && typeof p.watch !== "function");
        }

        players = await getCopy.playersPlus(players, {
            attrs: ["pid", "name", "age", "injury", "tid", "hof", "watch"],
            ratings: ["skills", "pos"],
            stats: ["abbrev", "tid", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "pm", "per", "ewa"],
            season: inputs.season, // If null, then show career stats!
            tid,
            statType: inputs.statType,
            playoffs: inputs.playoffs === "playoffs",
            regularSeason: inputs.playoffs !== "playoffs",
        });

        // Find max gp to use for filtering
        let gp = 0;
        for (const p of players) {
            if (p.stats.gp > gp) {
                gp = p.stats.gp;
            }
        }
        // Special case for career totals - use g.numGames games, unless this is the first season
        if (!inputs.season) {
            if (g.season > g.startingSeason) {
                gp = g.numGames;
            }
        }

        // Only keep players with more than 5 mpg in regular season, of any PT in playoffs
        if (inputs.abbrev !== "watch") {
            players = players.filter(p => {
                // Minutes played
                let min;
                if (inputs.statType === "totals") {
                    if (inputs.season) {
                        min = p.stats.min;
                    } else {
                        min = p.careerStats.min;
                    }
                } else if (inputs.season) {
                    min = p.stats.gp * p.stats.min;
                } else {
                    min = p.careerStats.gp * p.careerStats.min;
                }

                if (inputs.playoffs !== 'playoffs') {
                    if (min > gp * 5) {
                        return true;
                    }
                }

                // Or, keep players who played in playoffs
                if (inputs.playoffs === 'playoffs') {
                    if (inputs.season) {
                        if (p.stats.gp > 0) {
                            return true;
                        }
                    } else if (p.careerStatsPlayoffs.gp > 0) {
                        return true;
                    }
                }
            });
        }

        return {
            players,
            abbrev: inputs.abbrev,
            season: inputs.season,
            statType: inputs.statType,
            playoffs: inputs.playoffs,
        };
    }
}

export default {
    runBefore: [updatePlayers],
};
