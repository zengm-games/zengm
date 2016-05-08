const g = require('../globals');
const ui = require('../ui');
const $ = require('jquery');
const ko = require('knockout');
const components = require('./components');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

function get(req) {
    let abbrev;
    if (g.teamAbbrevsCache.indexOf(req.params.abbrev) >= 0) {
        abbrev = req.params.abbrev;
    } else {
        abbrev = "all";
    }

    let season;
    if (req.params.season && req.params.season !== "all") {
        season = helpers.validateSeason(req.params.season);
    } else {
        season = "all";
    }

    return {
        abbrev,
        season,
        playoffs: req.params.playoffs !== undefined ? req.params.playoffs : "regular_season"
    };
}

function InitViewModel() {
    this.abbrev = ko.observable();
    this.season = ko.observable();
    this.playoffs = ko.observable();
}

const mapping = {
    feats: {
        create: options => options.data
    }
};

async function updatePlayers(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("gameSim") >= 0 || inputs.abbrev !== vm.abbrev() || inputs.season !== vm.season() || inputs.playoffs !== vm.playoffs()) {
        let feats = await g.dbl.playerFeats.getAll();

        if (inputs.abbrev !== "all") {
            feats = feats.filter(feat => g.teamAbbrevsCache[feat.tid] === inputs.abbrev);
        }
        if (inputs.season !== "all") {
            feats = feats.filter(feat => feat.season === inputs.season);
        }
        feats = feats.filter(feat => {
            if (inputs.playoffs === "regular_season") {
                return !feat.playoffs;
            }
            if (inputs.playoffs === "playoffs") {
                return feat.playoffs;
            }
        });

        feats.forEach(feat => {
            feat.stats.trb = feat.stats.orb + feat.stats.drb;

            feat.stats.fgp = feat.stats.fga > 0 ? 100 * feat.stats.fg / feat.stats.fga : 0;
            feat.stats.tpp = feat.stats.tpa > 0 ? 100 * feat.stats.tp / feat.stats.tpa : 0;
            feat.stats.ftp = feat.stats.fta > 0 ? 100 * feat.stats.ft / feat.stats.fta : 0;

            if (feat.overtimes === 1) {
                feat.score += " (OT)";
            } else if (feat.overtimes > 1) {
                feat.score += ` (${feat.overtimes}OT)`;
            }
        });

        return {
            feats,
            abbrev: inputs.abbrev,
            season: inputs.season,
            playoffs: inputs.playoffs
        };
    }
}

function uiFirst(vm) {
    ui.title("Statistical Feats");

    ko.computed(() => {
        const rows = vm.feats().map(p => {
            const abbrev = g.teamAbbrevsCache[p.tid];
            const oppAbbrev = g.teamAbbrevsCache[p.oppTid];
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, [], p.watch), p.pos, `<a href="${helpers.leagueUrl(["roster", abbrev, p.season])}">${abbrev}</a>`, String(p.stats.gs), helpers.round(p.stats.min, 1), helpers.round(p.stats.fg, 0), helpers.round(p.stats.fga, 0), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.tp, 0), helpers.round(p.stats.tpa, 0), helpers.round(p.stats.tpp, 1), helpers.round(p.stats.ft, 0), helpers.round(p.stats.fta, 0), helpers.round(p.stats.ftp, 1), helpers.round(p.stats.orb, 0), helpers.round(p.stats.drb, 0), helpers.round(p.stats.trb, 0), helpers.round(p.stats.ast, 0), helpers.round(p.stats.tov, 0), helpers.round(p.stats.stl, 0), helpers.round(p.stats.blk, 0), helpers.round(p.stats.pf, 0), helpers.round(p.stats.pts, 0), helpers.gameScore(p.stats), `<a href="${helpers.leagueUrl(["roster", oppAbbrev, p.season])}">${oppAbbrev}</a>`, `<a href="${helpers.leagueUrl(["game_log", abbrev, p.season, p.gid])}">${p.won ? 'W' : 'L'} ${p.score}</a>`, String(p.season), p.tid === g.userTid];
        });

        ui.datatable($("#player-feats"), 23, rows, {
            rowCallback(row, data) {
                // Highlight user's team
                if (data[data.length - 1]) {
                    row.classList.add("info");
                }
            }
        });
    }).extend({throttle: 1});

    ui.tableClickableRows($("#player-feats"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("player-feats-dropdown", ["teamsAndAll", "seasonsAndAll", "playoffs"], [vm.abbrev(), vm.season(), vm.playoffs()], updateEvents);
}

module.exports = bbgmView.init({
    id: "playerFeats",
    get,
    InitViewModel,
    mapping,
    runBefore: [updatePlayers],
    uiFirst,
    uiEvery
});
