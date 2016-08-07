const g = require('../globals');
const ui = require('../ui');
const player = require('../core/player');
const team = require('../core/team');
const trade = require('../core/trade');
const Promise = require('bluebird');
const Davis = require('../lib/davis');
const $ = require('jquery');
const ko = require('knockout');
const komapping = require('knockout.mapping');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const Trade = require('./views/Trade');

// This relies on vars being populated, so it can't be called in parallel with updateTrade
async function updateSummary(vars) {
    const otherTid = await trade.getOtherTid();
    const teams = [{
        tid: g.userTid,
        pids: vars.userPids,
        dpids: vars.userDpids,
    }, {
        tid: otherTid,
        pids: vars.otherPids,
        dpids: vars.otherDpids,
    }];

    const summary = await trade.summary(teams);
    vars.summary = {
        enablePropose: !summary.warning && (teams[0].pids.length > 0 || teams[0].dpids.length > 0 || teams[1].pids.length > 0 || teams[1].dpids.length > 0),
        warning: summary.warning,
    };

    vars.summary.teams = [];
    for (let i = 0; i < 2; i++) {
        vars.summary.teams[i] = {
            name: summary.teams[i].name,
            payrollAfterTrade: summary.teams[i].payrollAfterTrade,
            total: summary.teams[i].total,
            trade: summary.teams[i].trade,
            picks: summary.teams[i].picks,
            other: i === 0 ? 1 : 0,  // Index of other team
        };
    }

    return vars;
}

// Validate that the stored player IDs correspond with the active team ID
async function validateSavedPids() {
    const teams = await trade.get();
    return trade.updatePlayers(teams);
}

function get(req) {
    if ((g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.PLAYOFFS) || g.phase === g.PHASE.FANTASY_DRAFT || g.gameOver) {
        return {
            errorMessage: "You're not allowed to make trades now.",
        };
    }

    return {
        message: req.raw.message !== undefined ? req.raw.message : null,
    };
}

async function post(req) {
    const pid = req.params.pid !== undefined ? parseInt(req.params.pid, 10) : null;

    let newOtherTid;
    if (req.raw.abbrev !== undefined) {
        const out = helpers.validateAbbrev(req.raw.abbrev);
        newOtherTid = out[0];
    } else if (req.params.tid !== undefined) {
        newOtherTid = parseInt(req.params.tid, 10);
    } else {
        newOtherTid = null;
    }

    const userPids = req.params.userPids !== undefined && req.params.userPids.length > 0 ? req.params.userPids.split(",").map(x => parseInt(x, 10)) : [];
    const otherPids = req.params.otherPids !== undefined && req.params.otherPids.length > 0 ? req.params.otherPids.split(",").map(x => parseInt(x, 10)) : [];
    const userDpids = req.params.userDpids !== undefined && req.params.userDpids.length > 0 ? req.params.userDpids.split(",").map(x => parseInt(x, 10)) : [];
    const otherDpids = req.params.otherDpids !== undefined && req.params.otherDpids.length > 0 ? req.params.otherDpids.split(",").map(x => parseInt(x, 10)) : [];

    const teams = [{
        tid: g.userTid,
        pids: userPids,
        dpids: userDpids,
    }, {
        tid: newOtherTid,
        pids: otherPids,
        dpids: otherDpids,
    }];

    if (req.params.propose !== undefined) {
        // Propose trade
        const message = await trade.propose(req.params.hasOwnProperty("force-trade")).get(1);
        ui.realtimeUpdate([], helpers.leagueUrl(["trade"]), undefined, {message});
    }
}

async function updateTrade(inputs) {
    let [teams, userRoster, userPicks] = await Promise.all([
        validateSavedPids(),
        g.dbl.players.index('tid').getAll(g.userTid).then(players => {
            return player.withStats(null, players, {statsSeasons: [g.season]});
        }),
        g.dbl.draftPicks.index('tid').getAll(g.userTid),
    ]);

    const attrs = ["pid", "name", "age", "contract", "injury", "watch", "gamesUntilTradable"];
    const ratings = ["ovr", "pot", "skills", "pos"];
    const stats = ["min", "pts", "trb", "ast", "per"];

    userRoster = player.filter(userRoster, {
        attrs,
        ratings,
        stats,
        season: g.season,
        tid: g.userTid,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });
    userRoster = trade.filterUntradable(userRoster);

    for (let i = 0; i < userRoster.length; i++) {
        if (teams[0].pids.indexOf(userRoster[i].pid) >= 0) {
            userRoster[i].selected = true;
        } else {
            userRoster[i].selected = false;
        }
    }

    for (let i = 0; i < userPicks.length; i++) {
        userPicks[i].desc = helpers.pickDesc(userPicks[i]);
    }

    const otherTid = teams[1].tid;

    // Need to do this after knowing otherTid
    let [otherRoster, otherPicks, t] = await Promise.all([
        g.dbl.players.index('tid').getAll(otherTid).then(players => {
            return player.withStats(null, players, {statsSeasons: [g.season]});
        }),
        g.dbl.draftPicks.index('tid').getAll(otherTid),
        team.filter({
            tid: otherTid,
            season: g.season,
            attrs: ["strategy"],
            seasonAttrs: ["won", "lost"],
        }),
    ]);

    otherRoster = player.filter(otherRoster, {
        attrs,
        ratings,
        stats,
        season: g.season,
        tid: otherTid,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });
    otherRoster = trade.filterUntradable(otherRoster);

    for (let i = 0; i < otherRoster.length; i++) {
        if (teams[1].pids.indexOf(otherRoster[i].pid) >= 0) {
            otherRoster[i].selected = true;
        } else {
            otherRoster[i].selected = false;
        }
    }

    for (let i = 0; i < otherPicks.length; i++) {
        otherPicks[i].desc = helpers.pickDesc(otherPicks[i]);
    }

    let vars = {
        salaryCap: g.salaryCap / 1000,
        userDpids: teams[0].dpids,
        userPicks,
        userPids: teams[0].pids,
        userRoster,
        otherDpids: teams[1].dpids,
        otherPicks,
        otherPids: teams[1].pids,
        otherRoster,
        otherTid,
        message: inputs.message,
        strategy: t.strategy,
        won: t.won,
        lost: t.lost,
        godMode: g.godMode,
        forceTrade: false,
    };
    vars = await updateSummary(vars);

    // Always run this, for multi team mode
    vars.teams = helpers.getTeams();
    vars.teams.splice(g.userTid, 1); // Can't trade with yourself
    vars.userTeamName = `${g.teamRegionsCache[g.userTid]} ${g.teamNamesCache[g.userTid]}`;

    // If the season is over, can't trade players whose contracts are expired
    if (g.phase > g.PHASE.PLAYOFFS && g.phase < g.PHASE.FREE_AGENCY) {
        vars.showResigningMsg = true;
    } else {
        vars.showResigningMsg = false;
    }

    return vars;
}

function uiFirst(vm) {
    // Don't use the dropdown function because this needs to be a POST
    $("#trade-select-team").change(() => {
        // ui.realtimeUpdate currently can't handle a POST request
        Davis.location.replace(new Davis.Request({
            abbrev: $("#trade-select-team").val(),
            fullPath: helpers.leagueUrl(["trade"]),
            method: "post",
        }));
    });

    // This would disable the propose button when it's clicked, but it prevents form submission in Chrome.
    /*$("#propose-trade button").click(function (event) {
        vm.summary.enablePropose(false); // Will be reenabled in updateSummary, if appropriate
    });*/

    const rosterCheckboxesUser = $("#roster-user input");
    const rosterCheckboxesOther = $("#roster-other input");

    $("#rosters").on("click", "input", async () => {
        vm.summary.enablePropose(false); // Will be reenabled in updateSummary, if appropriate
        vm.message("");

        const otherTid = await trade.getOtherTid();
        const serialized = $("#rosters").serializeArray();

        let teams = [{
            tid: g.userTid,
            pids: serialized.filter(o => o.name === "user-pids").map(o => o.value).map(Math.floor),
            dpids: serialized.filter(o => o.name === "user-dpids").map(o => o.value).map(Math.floor),
        }, {
            tid: otherTid,
            pids: serialized.filter(o => o.name === "other-pids").map(o => o.value).map(Math.floor),
            dpids: serialized.filter(o => o.name === "other-dpids").map(o => o.value).map(Math.floor),
        }];
        teams = await trade.updatePlayers(teams);

        let vars = {};
        vars.userPids = teams[0].pids;
        vars.otherPids = teams[1].pids;
        vars.userDpids = teams[0].dpids;
        vars.otherDpids = teams[1].dpids;
        vars = await updateSummary(vars);

        komapping.fromJS(vars, mapping, vm);

        for (let i = 0; i < rosterCheckboxesUser.length; i++) {
            let found = false;
            for (let j = 0; j < teams[0].pids.length; j++) {
                if (Math.floor(rosterCheckboxesUser[i].value) === teams[0].pids[j]) {
                    rosterCheckboxesUser[i].checked = true;
                    found = true;
                    break;
                }
            }
            if (!found) {
                rosterCheckboxesUser[i].checked = false;
            }
        }
        for (let i = 0; i < rosterCheckboxesOther.length; i++) {
            let found = false;
            for (let j = 0; j < teams[1].pids.length; j++) {
                if (Math.floor(rosterCheckboxesOther[i].value) === teams[1].pids[j]) {
                    rosterCheckboxesOther[i].checked = true;
                    found = true;
                    break;
                }
            }
            if (!found) {
                rosterCheckboxesOther[i].checked = false;
            }
        }
    });

    const tradeable = (userOrOther, roster) => {
        return roster.map(p => {
            const selected = p.selected ? ' checked = "checked"' : '';
            const disabled = p.untradable ? ' disabled = "disabled"' : '';
            const checkbox = `<input name="${userOrOther}-pids" type="checkbox" value="${p.pid}" title="${p.untradableMsg}"${selected}${disabled}>`;

            return [checkbox, helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.ratings.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), `${helpers.formatCurrency(p.contract.amount, "M")} thru ${p.contract.exp}`, helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1)];
        });
    };

    ko.computed(() => {
        ui.datatableSinglePage($("#roster-user"), 5, tradeable("user", vm.userRoster()), {
            columnDefs: [{
                orderable: false,
                targets: [0],
            }],
        });
    }).extend({throttle: 1});

    ko.computed(() => {
        ui.datatableSinglePage($("#roster-other"), 5, tradeable("other", vm.otherRoster()), {
            columnDefs: [{
                orderable: false,
                targets: [0],
            }],
        });
    }).extend({throttle: 1});

    ui.tableClickableRows($("#roster-user"));
    ui.tableClickableRows($("#roster-other"));
}

module.exports = bbgmViewReact.init({
    id: "trade",
    get,
    runBefore: [updateTrade],
    Component: Trade,
});
