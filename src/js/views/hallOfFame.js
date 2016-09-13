import g from '../globals';
import player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import HallOfFame from './views/HallOfFame';

async function updatePlayers(inputs, updateEvents) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.BEFORE_DRAFT)) {
        let players = await g.dbl.players.index('tid').getAll(g.PLAYER.RETIRED);
        players = players.filter(p => p.hof);
        players = await player.withStats(null, players, {statsSeasons: "all"});
        players = player.filter(players, {
            attrs: ["pid", "name", "draft", "retiredYear", "statsTids"],
            ratings: ["ovr", "pos"],
            stats: ["season", "abbrev", "gp", "min", "trb", "ast", "pts", "per", "ewa"],
        });

        // This stuff isn't in player.filter because it's only used here.
        for (let i = 0; i < players.length; i++) {
            players[i].peakOvr = 0;
            for (let j = 0; j < players[i].ratings.length; j++) {
                if (players[i].ratings[j].ovr > players[i].peakOvr) {
                    players[i].peakOvr = players[i].ratings[j].ovr;
                }
            }

            players[i].bestStats = {
                gp: 0,
                min: 0,
                per: 0,
            };
            for (let j = 0; j < players[i].stats.length; j++) {
                if (players[i].stats[j].gp * players[i].stats[j].min * players[i].stats[j].per > players[i].bestStats.gp * players[i].bestStats.min * players[i].bestStats.per) {
                    players[i].bestStats = players[i].stats[j];
                }
            }
        }

        return {
            players,
        };
    }
}

export default bbgmViewReact.init({
    id: "hallOfFame",
    runBefore: [updatePlayers],
    Component: HallOfFame,
});
