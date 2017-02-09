import backboard from 'backboard';
import Promise from 'bluebird';
import g from '../globals';
import * as player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import TeamHistory from './views/TeamHistory';

function get(ctx) {
    const inputs = {};
    inputs.show = ctx.params.show !== undefined ? ctx.params.show : "10";
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(ctx.params.abbrev);
    return inputs;
}

async function updateTeamHistory(inputs, updateEvents, state) {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || updateEvents.includes('gameSim') || inputs.abbrev !== state.abbrev) {
        let [teamSeasons, players] = await Promise.all([
            g.dbl.teamSeasons.index("tid, season").getAll(backboard.bound([inputs.tid], [inputs.tid, ''])),
            g.dbl.players.index('statsTids').getAll(inputs.tid).then(players2 => {
                return player.withStats(null, players2, {
                    statsSeasons: "all",
                    statsTid: inputs.tid,
                });
            }),
        ]);

        let bestRecord = null;
        let worstRecord = null;

        const history = [];
        let totalWon = 0;
        let totalLost = 0;
        let playoffAppearances = 0;
        let championships = 0;
        for (let i = 0; i < teamSeasons.length; i++) {
            history.push({
                season: teamSeasons[i].season,
                won: teamSeasons[i].won,
                lost: teamSeasons[i].lost,
                playoffRoundsWon: teamSeasons[i].playoffRoundsWon,
            });
            totalWon += teamSeasons[i].won;
            totalLost += teamSeasons[i].lost;
            if (teamSeasons[i].playoffRoundsWon >= 0) {
                playoffAppearances += 1;
            }
            if (teamSeasons[i].playoffRoundsWon === g.numPlayoffRounds) {
                championships += 1;
            }

            if (bestRecord === null || bestRecord.won < history[history.length - 1].won) {
                bestRecord = history[history.length - 1];
            }
            if (worstRecord === null || worstRecord.lost < history[history.length - 1].lost) {
                worstRecord = history[history.length - 1];
            }
        }
        history.reverse(); // Show most recent season first

        players = player.filter(players, {
            attrs: ["pid", "name", "injury", "tid", "hof", "watch"],
            ratings: ["pos"],
            stats: ["season", "abbrev", "gp", "min", "pts", "trb", "ast", "per", "ewa"],
            tid: inputs.tid,
        });

        for (let i = 0; i < players.length; i++) {
            players[i].stats.reverse();

            for (let j = 0; j < players[i].stats.length; j++) {
                if (players[i].stats[j].abbrev === g.teamAbbrevsCache[inputs.tid]) {
                    players[i].lastYr = players[i].stats[j].season.toString();
                    break;
                }
            }

            players[i].pos = players[i].ratings[players[i].ratings.length - 1].pos;

            delete players[i].ratings;
            delete players[i].stats;
        }

        return {
            abbrev: inputs.abbrev,
            history,
            players,
            team: {
                name: g.teamNamesCache[inputs.tid],
                region: g.teamRegionsCache[inputs.tid],
                tid: inputs.tid,
            },
            totalWon,
            totalLost,
            playoffAppearances,
            championships,
            bestRecord,
            worstRecord,
        };
    }
}

export default bbgmViewReact.init({
    id: "teamHistory",
    get,
    runBefore: [updateTeamHistory],
    Component: TeamHistory,
});
