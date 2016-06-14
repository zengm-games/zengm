const g = require('../globals');
const ui = require('../ui');
const freeAgents = require('../core/freeAgents');
const league = require('../core/league');
const player = require('../core/player');
const $ = require('jquery');
const ko = require('knockout');
const components = require('./components');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

function get(req) {
    return {
        statType: req.params.statType !== undefined ? req.params.statType : "per_game",
        playoffs: req.params.playoffs !== undefined ? req.params.playoffs : "regular_season"
    };
}

function InitViewModel() {
    this.statType = ko.observable();
    this.playoffs = ko.observable();
}

const mapping = {
    players: {
        create: options => options.data
    }
};

async function updatePlayers(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("clearWatchList") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || inputs.statType !== vm.statType() || inputs.playoffs !== vm.playoffs()) {
        let players = await g.dbl.players.getAll();
        players = players.filter(p => p.watch && typeof p.watch !== "function"); // In Firefox, objects have a "watch" function
        players = await player.withStats(null, players, {
            statsSeasons: [g.season, g.season - 1], // For oldStats
            statsPlayoffs: inputs.playoffs === "playoffs"
        });
        players = player.filter(players, {
            attrs: ["pid", "name", "age", "injury", "tid", "abbrev", "watch", "contract", "freeAgentMood", "draft"],
            ratings: ["ovr", "pot", "skills", "pos"],
            stats: ["gp", "min", "fgp", "tpp", "ftp", "trb", "ast", "tov", "stl", "blk", "pts", "per", "ewa"],
            season: g.season,
            totals: inputs.statType === "totals",
            per36: inputs.statType === "per_36",
            playoffs: inputs.playoffs === "playoffs",
            fuzz: true,
            showNoStats: true,
            showRookies: true,
            showRetired: true,
            oldStats: true
        });

        // Add mood to free agent contracts
        for (let i = 0; i < players.length; i++) {
            if (players[i].tid === g.PLAYER.FREE_AGENT) {
                players[i].contract.amount = freeAgents.amountWithMood(players[i].contract.amount, players[i].freeAgentMood[g.userTid]);
            }
        }

        return {
            players,
            playoffs: inputs.playoffs,
            statType: inputs.statType
        };
    }
}

function uiFirst(vm) {
    ui.title("Watch List");

    ko.computed(() => {
        // Number of decimals for many stats
        const d = vm.statType() === "totals" ? 0 : 1;

        const rows = [];
        const players = vm.players();
        for (let i = 0; i < vm.players().length; i++) {
            const p = players[i];

            // HACKS to show right stats, info
            if (vm.playoffs() === "playoffs") {
                p.stats = p.statsPlayoffs;

                // If no playoff stats, blank them
                ["gp", "min", "fgp", "tpp", "ftp", "trb", "ast", "tov", "stl", "blk", "pts", "per", "ewa"].forEach(category => {
                    if (p.stats[category] === undefined) {
                        p.stats[category] = 0;
                    }
                });
            }

            let contract;
            if (p.tid === g.PLAYER.RETIRED) {
                contract = "Retired";
            } else if (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3) {
                contract = `${p.draft.year} Draft Prospect`;
            } else {
                contract = `${helpers.formatCurrency(p.contract.amount, "M")} thru ${p.contract.exp}`;
            }

            rows.push([helpers.playerNameLabels(p.pid, p.firstName, p.lastName, p.injury, p.ratings.skills, p.watch), p.ratings.pos, String(p.age), `<a href="${helpers.leagueUrl(["roster", p.abbrev])}">${p.abbrev}</a>`, String(p.ratings.ovr), String(p.ratings.pot), contract, String(p.stats.gp), helpers.round(p.stats.min, d), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.tpp, 1), helpers.round(p.stats.ftp, 1), helpers.round(p.stats.trb, d), helpers.round(p.stats.ast, d), helpers.round(p.stats.tov, d), helpers.round(p.stats.stl, 1), helpers.round(p.stats.blk, d), helpers.round(p.stats.pts, d), helpers.round(p.stats.per, 1), helpers.round(p.stats.ewa, 1)]);
        }

        ui.datatable($("#watch-list"), 0, rows);
    }).extend({throttle: 1});

    ui.tableClickableRows($("#watch-list"));

    const clearWatchListEl = document.getElementById("clear-watch-list");
    clearWatchListEl.addEventListener("click", async () => {
        clearWatchListEl.disabled = true;

        await g.dbl.tx("players", "readwrite", tx => {
            return tx.players.iterate(p => {
                if (p.watch) {
                    p.watch = false;
                    return p;
                }
            });
        });

        league.updateLastDbChange();
        ui.realtimeUpdate(["clearWatchList"]);
        clearWatchListEl.disabled = false;
    });
}

function uiEvery(updateEvents, vm) {
    components.dropdown("watch-list-dropdown", ["statTypes", "playoffs"], [vm.statType(), vm.playoffs()], updateEvents);
}

module.exports = bbgmView.init({
    id: "watchList",
    get,
    InitViewModel,
    mapping,
    runBefore: [updatePlayers],
    uiFirst,
    uiEvery
});
