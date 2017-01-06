import backboard from 'backboard';
import Promise from 'bluebird';
import g from '../globals';
import * as player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import Leaders from './views/Leaders';

function get(ctx) {
    return {
        season: helpers.validateSeason(ctx.params.season),
    };
}

async function updateLeaders(inputs, updateEvents, state) {
    // Respond to watchList in case players are listed twice in different categories
    if (updateEvents.includes('dbChange') || updateEvents.includes('watchList') || (inputs.season === g.season && updateEvents.includes('gameSim')) || inputs.season !== state.season) {
        let [teamSeasons, players] = await Promise.all([
            g.dbl.teamSeasons.index("season, tid").getAll(backboard.bound([inputs.season], [inputs.season, ''])),
            g.dbl.players.getAll().then(players2 => {
                return player.withStats(null, players2, {statsSeasons: [inputs.season]});
            }),
        ]);

        // Calculate the number of games played for each team, which is used later to test if a player qualifies as a league leader
        const gps = teamSeasons.map(teamSeason => {
            // Don't count playoff games
            if (teamSeason.gp > g.numGames) {
                return g.numGames;
            }
            return teamSeason.gp;
        });

        players = player.filter(players, {
            attrs: ["pid", "name", "injury", "watch"],
            ratings: ["skills"],
            stats: ["pts", "trb", "ast", "fgp", "tpp", "ftp", "blk", "stl", "min", "per", "ewa", "gp", "fg", "tp", "ft", "abbrev", "tid"],
            season: inputs.season,
        });

        const userAbbrev = helpers.getAbbrev(g.userTid);

        // minStats and minValues are the NBA requirements to be a league leader for each stat http://www.nba.com/leader_requirements.html. If any requirement is met, the player can appear in the league leaders
        const factor = (g.numGames / 82) * Math.sqrt(g.quarterLength / 12); // To handle changes in number of games and playing time
        const categories = [];
        categories.push({name: "Points", stat: "Pts", title: "Points Per Game", data: [], minStats: ["gp", "pts"], minValue: [70, 1400]});
        categories.push({name: "Rebounds", stat: "Reb", title: "Rebounds Per Game", data: [], minStats: ["gp", "trb"], minValue: [70, 800]});
        categories.push({name: "Assists", stat: "Ast", title: "Assists Per Game", data: [], minStats: ["gp", "ast"], minValue: [70, 400]});
        categories.push({name: "Field Goal Percentage", stat: "FG%", title: "Field Goal Percentage", data: [], minStats: ["fg"], minValue: [300]});
        categories.push({name: "Three-Pointer Percentage", stat: "3PT%", title: "Three-Pointer Percentage", data: [], minStats: ["tp"], minValue: [55]});
        categories.push({name: "Free Throw Percentage", stat: "FT%", title: "Free Throw Percentage", data: [], minStats: ["ft"], minValue: [125]});
        categories.push({name: "Blocks", stat: "Blk", title: "Blocks Per Game", data: [], minStats: ["gp", "blk"], minValue: [70, 100]});
        categories.push({name: "Steals", stat: "Stl", title: "Steals Per Game", data: [], minStats: ["gp", "stl"], minValue: [70, 125]});
        categories.push({name: "Minutes", stat: "Min", title: "Minutes Per Game", data: [], minStats: ["gp", "min"], minValue: [70, 2000]});
        categories.push({name: "Player Efficiency Rating", stat: "PER", title: "Player Efficiency Rating", data: [], minStats: ["min"], minValue: [2000]});
        categories.push({name: "Estimated Wins Added", stat: "EWA", title: "Estimated Wins Added", data: [], minStats: ["min"], minValue: [2000]});
        const stats = ["pts", "trb", "ast", "fgp", "tpp", "ftp", "blk", "stl", "min", "per", "ewa"];

        for (let i = 0; i < categories.length; i++) {
            players.sort((a, b) => b.stats[stats[i]] - a.stats[stats[i]]);
            for (let j = 0; j < players.length; j++) {
                // Test if the player meets the minimum statistical requirements for this category
                let pass = false;
                for (let k = 0; k < categories[i].minStats.length; k++) {
                    // Everything except gp is a per-game average, so we need to scale them by games played
                    let playerValue;
                    if (categories[i].minStats[k] === "gp") {
                        playerValue = players[j].stats[categories[i].minStats[k]];
                    } else {
                        playerValue = players[j].stats[categories[i].minStats[k]] * players[j].stats.gp;
                    }

                    // Compare against value normalized for team games played
                    if (playerValue >= Math.ceil(categories[i].minValue[k] * factor * gps[players[j].stats.tid] / g.numGames)) {
                        pass = true;
                        break;  // If one is true, don't need to check the others
                    }
                }

                if (pass) {
                    const leader = helpers.deepCopy(players[j]);
                    leader.stat = leader.stats[stats[i]];
                    leader.abbrev = leader.stats.abbrev;
                    delete leader.stats;
                    if (userAbbrev === leader.abbrev) {
                        leader.userTeam = true;
                    } else {
                        leader.userTeam = false;
                    }
                    categories[i].data.push(leader);
                }

                // Stop when we found 10
                if (categories[i].data.length === 10) {
                    break;
                }
            }

            delete categories[i].minStats;
            delete categories[i].minValue;
        }

        return {
            categories,
            season: inputs.season,
        };
    }
}

export default bbgmViewReact.init({
    id: "leaders",
    get,
    runBefore: [updateLeaders],
    Component: Leaders,
});
