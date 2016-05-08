const g = require('../globals');
const ui = require('../ui');
const player = require('../core/player');
const backboard = require('backboard');
const $ = require('jquery');
const ko = require('knockout');
const components = require('./components');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

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
        playoffs: req.params.playoffs !== undefined ? req.params.playoffs : "regular_season"
    };
}

function InitViewModel() {
    this.abbrev = ko.observable();
    this.season = ko.observable();
    this.statType = ko.observable();
    this.playoffs = ko.observable();
}

const mapping = {
    players: {
        create: options => options.data
    }
};

async function updatePlayers(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.abbrev !== vm.abbrev() || inputs.season !== vm.season() || inputs.statType !== vm.statType() || inputs.playoffs !== vm.playoffs()) {
        let players = await g.dbl.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.RETIRED));
        players = await player.withStats(null, players, {
            statsSeasons: inputs.season !== null ? [inputs.season] : "all", // If no season is input, get all stats for career totals
            statsPlayoffs: inputs.playoffs === "playoffs"
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
            playoffs: inputs.playoffs === "playoffs"
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

        // Only keep players with more than 5 mpg
        if (inputs.abbrev !== "watch") {
            players = players.filter(function (p) {
                // Minutes played
                let min;
                if (inputs.statType === "totals") {
                    if (inputs.season) {
                        min = p.stats.min;
                    } else {
                        min = p.careerStats.min;
                    }
                } else {
                    if (inputs.season) {
                        min = p.stats.gp * p.stats.min;
                    } else {
                        min = p.careerStats.gp * p.careerStats.min;
                    }
                }

                if (min > gp * 5) {
                    return true;
                }
            });
        }

        return {
            players,
            abbrev: inputs.abbrev,
            season: inputs.season,
            statType: inputs.statType,
            playoffs: inputs.playoffs
        };
    }
}

function uiFirst(vm) {
    ko.computed(() => {
        const label = vm.season() !== null ? vm.season() : "Career Totals";
        ui.title("Player Stats - " + label);
    }).extend({throttle: 1});

    ko.computed(() => {
        const season = vm.season();

        // Number of decimals for many stats
        const d = vm.statType() === "totals" ? 0 : 1;

        const rows = [];
        const players = vm.players();
        for (let i = 0; i < vm.players().length; i++) {
            const p = players[i];

            let pos;
            if (p.ratings.constructor === Array) {
                pos = p.ratings[p.ratings.length - 1].pos;
            } else if (p.ratings.pos) {
                pos = p.ratings.pos;
            } else {
                pos = "?";
            }

            // HACKS to show right stats, info
            let abbrev, tid;
            if (season === null) {
                p.stats = p.careerStats;
                abbrev = helpers.getAbbrev(p.tid);
                tid = p.tid;
                if (vm.playoffs() === "playoffs") {
                    p.stats = p.careerStatsPlayoffs;
                }
            } else {
                abbrev = p.stats.abbrev;
                tid = p.stats.tid;
                if (vm.playoffs() === "playoffs") {
                    p.stats = p.statsPlayoffs;
                }
            }

            // Skip no stats: never played, didn't make playoffs, etc
            if (p.stats.gp) {
                rows.push([helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), pos, '<a href="' + helpers.leagueUrl(["roster", abbrev, season]) + '">' + abbrev + '</a>', String(p.stats.gp), String(p.stats.gs), helpers.round(p.stats.min, d), helpers.round(p.stats.fg, d), helpers.round(p.stats.fga, d), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.tp, d), helpers.round(p.stats.tpa, d), helpers.round(p.stats.tpp, 1), helpers.round(p.stats.ft, d), helpers.round(p.stats.fta, d), helpers.round(p.stats.ftp, 1), helpers.round(p.stats.orb, d), helpers.round(p.stats.drb, d), helpers.round(p.stats.trb, d), helpers.round(p.stats.ast, d), helpers.round(p.stats.tov, d), helpers.round(p.stats.stl, d), helpers.round(p.stats.blk, d), helpers.round(p.stats.ba, d), helpers.round(p.stats.pf, d), helpers.round(p.stats.pts, d), helpers.plusMinus(p.stats.pm, d), helpers.round(p.stats.per, 1), helpers.round(p.stats.ewa, 1), p.hof, tid === g.userTid]);
            }
        }

        ui.datatable($("#player-stats"), 2, rows, {
            rowCallback(row, data) {
                // Highlight HOF players
                if (data[data.length - 2]) {
                    row.classList.add("danger");
                }
                // Highlight user's team
                if (data[data.length - 1]) {
                    row.classList.add("info");
                }
            }
        });
    }).extend({throttle: 1});

    ui.tableClickableRows($("#player-stats"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("player-stats-dropdown", ["teamsAndAllWatch", "seasonsAndCareer", "statTypes", "playoffs"], [vm.abbrev(), vm.season(), vm.statType(), vm.playoffs()], updateEvents);
}

module.exports = bbgmView.init({
    id: "playerStats",
    get,
    InitViewModel,
    mapping,
    runBefore: [updatePlayers],
    uiFirst,
    uiEvery
});
