import g from '../globals';
import {getCopy} from '../db';
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
        let bestRecord = null;
        let worstRecord = null;

        const teamSeasons = await getCopy.teamSeasons({tid: inputs.tid});
        const history = [];
        let totalWon = 0;
        let totalLost = 0;
        let playoffAppearances = 0;
        let championships = 0;
        for (const teamSeason of teamSeasons) {
            history.push({
                season: teamSeason.season,
                won: teamSeason.won,
                lost: teamSeason.lost,
                playoffRoundsWon: teamSeason.playoffRoundsWon,
            });
            totalWon += teamSeason.won;
            totalLost += teamSeason.lost;
            if (teamSeason.playoffRoundsWon >= 0) {
                playoffAppearances += 1;
            }
            if (teamSeason.playoffRoundsWon === g.numPlayoffRounds) {
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

        let players = await getCopy.players({statsTid: inputs.tid});
        players = await getCopy.playersPlus(players, {
            attrs: ["pid", "name", "injury", "tid", "hof", "watch"],
            ratings: ["pos"],
            stats: ["season", "abbrev", "gp", "min", "pts", "trb", "ast", "per", "ewa"],
            tid: inputs.tid,
        });

        for (const p of players) {
            p.stats.reverse();

            for (let j = 0; j < p.stats.length; j++) {
                if (p.stats[j].abbrev === g.teamAbbrevsCache[inputs.tid]) {
                    p.lastYr = p.stats[j].season.toString();
                    break;
                }
            }

            p.pos = p.ratings[p.ratings.length - 1].pos;

            delete p.ratings;
            delete p.stats;
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
