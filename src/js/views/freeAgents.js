const g = require('../globals');
const ui = require('../ui');
const freeAgents = require('../core/freeAgents');
const player = require('../core/player');
const team = require('../core/team');
const Promise = require('bluebird');
const $ = require('jquery');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

function disableButtons() {
    $("#free-agents button").attr("disabled", "disabled");
    $("#game-sim-warning").show();
}

function enableButtons() {
    $("#free-agents button").removeAttr("disabled");
    $("#game-sim-warning").hide();
}

function get() {
    if (g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.RESIGN_PLAYERS) {
        if (g.phase === g.PHASE.RESIGN_PLAYERS) {
            return {
                redirectUrl: helpers.leagueUrl(["negotiation"]),
            };
        }

        return {
            errorMessage: "You're not allowed to sign free agents now.",
        };
    }
}

const mapping = {
    players: {
        create: options => options.data,
    },
};

async function updateFreeAgents() {
    let [payroll, userPlayers, players] = await Promise.all([
        team.getPayroll(null, g.userTid).get(0),
        g.dbl.players.index('tid').getAll(g.userTid),
        g.dbl.players.index('tid').getAll(g.PLAYER.FREE_AGENT).then(players => {
            return player.withStats(null, players, {
                statsSeasons: [g.season, g.season - 1],
            });
        }),
    ]);

    let capSpace = (g.salaryCap - payroll) / 1000;
    if (capSpace < 0) {
        capSpace = 0;
    }

    players = player.filter(players, {
        attrs: ["pid", "name", "age", "contract", "freeAgentMood", "injury", "watch"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["min", "pts", "trb", "ast", "per"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
        oldStats: true,
    });

    for (let i = 0; i < players.length; i++) {
        players[i].contract.amount = freeAgents.amountWithMood(players[i].contract.amount, players[i].freeAgentMood[g.userTid]);
        players[i].mood = player.moodColorText(players[i]);
    }

    return {
        capSpace,
        numRosterSpots: 15 - userPlayers.length,
        players,
    };
}

function uiFirst(vm) {
    ui.title("Free Agents");

    $("#help-salary-cap").popover({
        title: "Cap Space",
        html: true,
        content: `<p>"Cap space" is the difference between your current payroll and the salary cap. You can sign a free agent to any valid contract as long as you don't go over the cap.</p>You can only exceed the salary cap to sign free agents to minimum contracts ($${g.minContract}k/year).`,
    });

    ko.computed(() => {
        ui.datatable($("#free-agents"), 4, vm.players().map(p => {
            let negotiateButton;
            if (freeAgents.refuseToNegotiate(p.contract.amount * 1000, p.freeAgentMood[g.userTid])) {
                negotiateButton = "Refuses!";
            } else {
                negotiateButton = `<form action="${helpers.leagueUrl(["negotiation", p.pid], {noQueryString: true})}" method="POST" style="margin: 0"><input type="hidden" name="new" value="1"><button type="submit" class="btn btn-default btn-xs">Negotiate</button></form>`;
            }
            // The display: none for mood allows sorting, somehow
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.ratings.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1), `${helpers.formatCurrency(p.contract.amount, "M")} thru ${p.contract.exp}`, `<div title="${p.mood.text}" style="width: 100%; height: 21px; background-color: ${p.mood.color}"><span style="display: none">${p.freeAgentMood[g.userTid]}</span></div>`, negotiateButton];
        }));
    }).extend({throttle: 1});

    ui.tableClickableRows($("#free-agents"));

    // Form enabling/disabling
    $("#free-agents").on("gameSimulationStart", disableButtons);
    $("#free-agents").on("gameSimulationStop", enableButtons);
}

function uiEvery() {
    // Wait for datatable
    setTimeout(() => {
        if (g.gamesInProgress) {
            disableButtons();
        } else {
            enableButtons();
        }
    }, 10);
}

module.exports = bbgmView.init({
    id: "freeAgents",
    get,
    mapping,
    runBefore: [updateFreeAgents],
    uiFirst,
    uiEvery,
});
