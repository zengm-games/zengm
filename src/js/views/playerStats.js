import backboard from 'backboard';
import g from '../globals';
import player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import helpers from '../util/helpers';
import PlayerStats from './views/PlayerStats';

function get(req) {
    let abbrev;
    if (g.teamAbbrevsCache.indexOf(req.params.abbrev) >= 0) {
        abbrev = req.params.abbrev;
    } else if (req.params.abbrev && req.params.abbrev === 'watch') {
        abbrev = "watch";
    } else {
        abbrev = "all";
    }

    return {
        abbrev,
        season: req.params.season === "career" ? null : helpers.validateSeason(req.params.season),
        statType: req.params.statType !== undefined ? req.params.statType : "per_game",
        playoffs: req.params.playoffs !== undefined ? req.params.playoffs : "regular_season",
    };
}

async function updatePlayers(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.abbrev !== state.abbrev || inputs.season !== state.season || inputs.statType !== state.statType || inputs.playoffs !== state.playoffs) {
        return g.dbl.tx(["players", "playerStats"], async tx => {
            let players = await tx.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.RETIRED));
            players = await player.withStats(tx, players, {
                statsSeasons: inputs.season !== null ? [inputs.season] : "all", // If no season is input, get all stats for career totals
                statsPlayoffs: inputs.playoffs === "playoffs",
            });

            let tid = g.teamAbbrevsCache.indexOf(inputs.abbrev);
            if (tid < 0) { tid = null; } // Show all teams

            if (!tid && inputs.abbrev === "watch") {
                players = players.filter(p => p.watch && typeof p.watch !== "function");
            }

            players = player.filter(players, {
                attrs: ["pid", "name", "age", "injury", "tid", "hof", "watch"],
                ratings: ["skills", "pos"],
                stats: ["abbrev", "tid", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "pm", "per", "ewa"],
                season: inputs.season, // If null, then show career stats!
                tid,
                totals: inputs.statType === "totals",
                per36: inputs.statType === "per_36",
                playoffs: inputs.playoffs === "playoffs",
            });

            // Find max gp to use for filtering
            let gp = 0;
            for (let i = 0; i < players.length; i++) {
                if (players[i].stats.gp > gp) {
                    gp = players[i].stats.gp;
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
                            if (p.statsPlayoffs.gp > 0) {
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
        });
    }
}

export default bbgmViewReact.init({
    id: "playerStats",
    get,
    runBefore: [updatePlayers],
    Component: PlayerStats,
});
