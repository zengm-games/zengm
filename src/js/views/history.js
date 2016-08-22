const g = require('../globals');
const player = require('../core/player');
const team = require('../core/team');
const Promise = require('bluebird');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const History = require('./views/History');

function get(req) {
    let season = helpers.validateSeason(req.params.season);

    // If playoffs aren't over, season awards haven't been set
    if (g.phase <= g.PHASE.PLAYOFFS) {
        // View last season by default
        if (season === g.season) {
            season -= 1;
        }
    }

    if (season < g.startingSeason) {
        return {
            errorMessage: "There is no league history yet. Check back after the playoffs.",
        };
    }

    return {
        season,
    };
}

async function updateHistory(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || state.season !== inputs.season) {
        let [awards, retiredPlayers, teams] = await Promise.all([
            g.dbl.awards.get(inputs.season),
            g.dbl.players.index('retiredYear').getAll(inputs.season).then(players => {
                return player.withStats(null, players, {
                    statsSeasons: [inputs.season],
                });
            }),
            team.filter({
                attrs: ["tid", "abbrev", "region", "name"],
                seasonAttrs: ["playoffRoundsWon"],
                season: inputs.season,
            }),
        ]);

        // Hack placeholder for old seasons before Finals MVP existed
        if (!awards.hasOwnProperty("finalsMvp")) {
            awards.finalsMvp = {
                pid: 0,
                name: "N/A",
                pts: 0,
                trb: 0,
                ast: 0,
            };
        }

        // Hack placeholder for old seasons before Finals MVP existed
        if (!awards.hasOwnProperty("allRookie")) {
            awards.allRookie = [];
        }

        // For old league files, this format is obsolete now
        if (awards.bre && awards.brw) {
            awards.bestRecordConfs = [awards.bre, awards.brw];
        }

        retiredPlayers = player.filter(retiredPlayers, {
            attrs: ["pid", "name", "age", "hof"],
            season: inputs.season,
            stats: ["tid", "abbrev"],
            showNoStats: true,
        });
        for (let i = 0; i < retiredPlayers.length; i++) {
            // Show age at retirement, not current age
            retiredPlayers[i].age -= g.season - inputs.season;
        }
        retiredPlayers.sort((a, b) => b.age - a.age);

        // Get champs
        let champ;
        for (let i = 0; i < teams.length; i++) {
            if (teams[i].playoffRoundsWon === g.numPlayoffRounds) {
                champ = teams[i];
                break;
            }
        }

        return {
            awards,
            champ,
            confs: g.confs,
            retiredPlayers,
            season: inputs.season,
            userTid: g.userTid,
        };
    }
}

module.exports = bbgmViewReact.init({
    id: "history",
    get,
    runBefore: [updateHistory],
    Component: History,
});
