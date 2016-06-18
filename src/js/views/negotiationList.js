const g = require('../globals');
const ui = require('../ui');
const freeAgents = require('../core/freeAgents');
const player = require('../core/player');
const Promise = require('bluebird');
const $ = require('jquery');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

function get() {
    if (g.phase !== g.PHASE.RESIGN_PLAYERS) {
        return {
            redirectUrl: helpers.leagueUrl(["negotiation", -1]),
        };
    }
}

const mapping = {
    players: {
        create: options => options.data,
    },
};

async function updateNegotiationList() {
    // Get all free agents, filter array based on negotiations data, pass to player.filter, augment with contract data from negotiations
    let [negotiations, players] = await Promise.all([
        g.dbl.negotiations.getAll(),
        g.dbl.players.index('tid').getAll(g.PLAYER.FREE_AGENT).then(players => {
            return player.withStats(null, players, {
                statsSeasons: [g.season],
                statsTid: g.userTid,
            });
        }),
    ]);

    // For Multi Team Mode, might have other team's negotiations going on
    negotiations = negotiations.filter(negotiation => negotiation.tid === g.userTid);
    const negotiationPids = negotiations.map(negotiation => negotiation.pid);

    players = players.filter(p => negotiationPids.indexOf(p.pid) >= 0);
    players = player.filter(players, {
        attrs: ["pid", "name", "age", "freeAgentMood", "injury", "watch"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["min", "pts", "trb", "ast", "per"],
        season: g.season,
        tid: g.userTid,
        showNoStats: true,
        fuzz: true,
    });

    for (let i = 0; i < players.length; i++) {
        for (let j = 0; j < negotiations.length; j++) {
            if (players[i].pid === negotiations[j].pid) {
                players[i].contract = {};
                players[i].contract.amount = negotiations[j].player.amount / 1000;
                players[i].contract.exp = g.season + negotiations[j].player.years;
                break;
            }
        }

        players[i].mood = player.moodColorText(players[i]);
    }

    return {
        players,
    };
}

function uiFirst(vm) {
    ui.title("Re-sign Players");

    ko.computed(() => {
        ui.datatable($("#negotiation-list"), 4, vm.players().map(p => {
            let negotiateButton;
            if (freeAgents.refuseToNegotiate(p.contract.amount * 1000, p.freeAgentMood[g.userTid])) {
                negotiateButton = "Refuses!";
            } else {
                // This can be a plain link because the negotiation has already been started at this point.
                negotiateButton = `<a href="${helpers.leagueUrl(["negotiation", p.pid])}" class="btn btn-default btn-xs">Negotiate</a>`;
            }
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.ratings.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1), `${helpers.formatCurrency(p.contract.amount, "M")} thru ${p.contract.exp}`, `<div title="${p.mood.text}" style="width: 100%; height: 21px; background-color: ${p.mood.color}"><span style="display: none">${p.freeAgentMood[g.userTid]}</span></div>`, negotiateButton];
        }));
    }).extend({throttle: 1});

    ui.tableClickableRows($("#negotiation-list"));
}

module.exports = bbgmView.init({
    id: "negotiationList",
    get,
    mapping,
    runBefore: [updateNegotiationList],
    uiFirst,
});
