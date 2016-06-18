const g = require('../globals');
const ui = require('../ui');
const player = require('../core/player');
const backboard = require('backboard');
const Promise = require('bluebird');
const $ = require('jquery');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');
const components = require('./components');


function get(req) {
    const inputs = {};
    inputs.show = req.params.show !== undefined ? req.params.show : "10";
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(req.params.abbrev);
    return inputs;
}

const mapping = {
    history: {
        create: options => options.data,
    },
    players: {
        create: options => options.data,
    },
};

async function updateTeamHistory(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || inputs.abbrev !== vm.abbrev()) {
        let [teamSeasons, players] = await Promise.all([
            g.dbl.teamSeasons.index("tid, season").getAll(backboard.bound([inputs.tid], [inputs.tid, ''])),
            g.dbl.players.index('statsTids').getAll(inputs.tid).then(players => {
                return player.withStats(null, players, {
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
            if (teamSeasons[i].playoffRoundsWon === 4) {
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

function uiFirst(vm) {
    ui.title("Team History");

    ko.computed(() => {
        ui.datatable($("#team-history-players"), 2, vm.players().map(p => {
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, [], p.watch), p.pos, String(p.careerStats.gp), helpers.round(p.careerStats.min, 1), helpers.round(p.careerStats.pts, 1), helpers.round(p.careerStats.trb, 1), helpers.round(p.careerStats.ast, 1), helpers.round(p.careerStats.per, 1), helpers.round(p.careerStats.ewa, 1), p.lastYr, p.hof, p.tid > g.PLAYER.RETIRED && p.tid !== vm.team.tid(), p.tid === vm.team.tid()];
        }), {
            rowCallback(row, data) {
                // Highlight active players
                if (data[data.length - 1]) {
                    row.classList.add("success"); // On this team
                } else if (data[data.length - 2]) {
                    row.classList.add("info"); // On other team
                } else if (data[data.length - 3]) {
                    row.classList.add("danger"); // Hall of Fame
                }
            },
        });
    }).extend({throttle: 1});

    ui.tableClickableRows($("#team-history-players"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("team-history-dropdown", ["teams"], [vm.abbrev()], updateEvents);
}

module.exports = bbgmView.init({
    id: "teamHistory",
    get,
    mapping,
    runBefore: [updateTeamHistory],
    uiFirst,
    uiEvery,
});
