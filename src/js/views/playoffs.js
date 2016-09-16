import g from '../globals';
import * as season from '../core/season';
import * as team from '../core/team';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import Playoffs from './views/Playoffs';

function get(req) {
    return {
        season: helpers.validateSeason(req.params.season),
    };
}

async function updatePlayoffs(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.season !== state.season || (inputs.season === g.season && updateEvents.indexOf("gameSim") >= 0)) {
        let finalMatchups;
        let series;

        // If in the current season and before playoffs started, display projected matchups
        if (inputs.season === g.season && g.phase < g.PHASE.PLAYOFFS) {
            const teams = await team.filter({
                attrs: ["tid", "cid", "abbrev", "name"],
                seasonAttrs: ["winp"],
                season: inputs.season,
                sortBy: ["winp", "-lost", "won"],
            });

            const result = season.genPlayoffSeries(teams);
            series = result.series;

            finalMatchups = false;
        } else {
            const playoffSeries = await g.dbl.playoffSeries.get(inputs.season);
            series = playoffSeries.series;

            finalMatchups = true;
        }

        // Formatting for the table in playoffs.html
        const matchups = [];
        for (let i = 0; i < Math.pow(2, g.numPlayoffRounds - 2); i++) {
            matchups[i] = [];
        }
        // Fill in with each round. Good lord, this is confusing, due to having to assemble it for an HTML table with rowspans.
        for (let i = 0; i < g.numPlayoffRounds; i++) {
            let numGamesInSide = Math.pow(2, g.numPlayoffRounds - i - 2);
            if (numGamesInSide < 1) {
                numGamesInSide = 1;
            }

            const rowspan = Math.pow(2, i);
            for (let j = 0; j < numGamesInSide; j++) {
                matchups[j * rowspan].splice(i, 0, {
                    rowspan,
                    matchup: [i, j],
                });
                if (g.numPlayoffRounds !== i + 1) {
                    matchups[j * rowspan].splice(i, 0, {
                        rowspan,
                        matchup: [i, numGamesInSide + j],
                    });
                }
            }
        }

        const confNames = g.confs.map(conf => conf.name);

        // Display the current or archived playoffs
        return {
            finalMatchups,
            matchups,
            numPlayoffRounds: g.numPlayoffRounds,
            confNames,
            season: inputs.season,
            series,
        };
    }
}

export default bbgmViewReact.init({
    id: "playoffs",
    get,
    runBefore: [updatePlayoffs],
    Component: Playoffs,
});
