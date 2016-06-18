const g = require('../globals');
const ui = require('../ui');
const player = require('../core/player');
const team = require('../core/team');
const trade = require('../core/trade');
const Promise = require('bluebird');
const $ = require('jquery');
const ko = require('knockout');
const _ = require('underscore');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');
const random = require('../util/random');

async function getOffers(userPids, userDpids) {
    // Initialize progress bar
    const progressBar = document.querySelector("#ask-progress .progress-bar");
    progressBar.style.width = "10%";

    // Pick 10 random teams to try
    const tids = _.range(g.numTeams);
    random.shuffle(tids);
    tids.splice(11, 19);

    const estValues = await trade.getPickValues();

    // For width of progress bar
    let numTeams = tids.length;
    if (tids.indexOf(g.userTid) >= 0) {
        numTeams -= 1;
    }
    let done = 0;

    const offers = [];
    for (const tid of tids) {
        let teams = [{
            tid: g.userTid,
            pids: userPids,
            dpids: userDpids,
        }, {
            tid,
            pids: [],
            dpids: [],
        }];

        if (tid !== g.userTid) {
            const [found, teams2] = await trade.makeItWork(teams, true, estValues);
            teams = teams2;

            // Update progress bar
            done += 1;
            progressBar.style.width = `${Math.round(10 + 90 * done / numTeams)}%`;

            if (found) {
                const summary = await trade.summary(teams);
                teams[1].warning = summary.warning;
                offers.push(teams[1]);
            }
        }
    }

    return offers;
}

function get(req) {
    if (g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.PLAYOFFS) {
        return {
            errorMessage: "You're not allowed to make trades now.",
        };
    }

    return {
        userPids: req.raw.userPids !== undefined ? req.raw.userPids : [],
        userDpids: req.raw.userDpids !== undefined ? req.raw.userDpids : [],
        offers: req.raw.offers !== undefined ? req.raw.offers : [],
    };
}

async function post(req) {
    const buttonEl = document.getElementById("ask-button");
    buttonEl.style.display = "none";
    const progressEl = document.getElementById("ask-progress");
    progressEl.style.display = "block";

    const userPids = req.params.hasOwnProperty('pids') ? req.params.pids.map(x => parseInt(x, 10)) : [];
    const userDpids = req.params.hasOwnProperty('dpids') ? req.params.dpids.map(x => parseInt(x, 10)) : [];

    const offers = await getOffers(userPids, userDpids);
    ui.realtimeUpdate(["tradingBlockAsk"], helpers.leagueUrl(["trading_block"]), () => {
        buttonEl.style.display = "inline";
        progressEl.style.display = "none";

        window.setTimeout(() => {
            // Ugly hack, since there is no good way to do this (bbgmView needs better signals.. curse of rolling your own)
            const tableEls = $(".offer-players");
            if (tableEls.length > 0 && !tableEls[0].classList.contains("table-hover")) {
                ui.tableClickableRows(tableEls);
            }
        }, 500);
    }, {
        userPids,
        userDpids,
        offers,
    });
}

const mapping = {
    userPicks: {
        create: options => options.data,
    },
    userRoster: {
        create: options => options.data,
    },
};

async function updateUserRoster(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("tradingBlockAsk") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("gameSim") >= 0) {
        let [userRoster, userPicks] = await Promise.all([
            g.dbl.players.index('tid').getAll(g.userTid).then(players => {
                return player.withStats(null, players, {
                    statsSeasons: [g.season],
                    statsTid: g.userTid,
                });
            }),
            g.dbl.draftPicks.index('tid').getAll(g.userTid),
        ]);

        userRoster = player.filter(userRoster, {
            attrs: ["pid", "name", "age", "contract", "injury", "watch", "gamesUntilTradable"],
            ratings: ["ovr", "pot", "skills", "pos"],
            stats: ["min", "pts", "trb", "ast", "per"],
            season: g.season,
            tid: g.userTid,
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });
        userRoster = trade.filterUntradable(userRoster);
        for (let i = 0; i < userRoster.length; i++) {
            if (inputs.userPids.indexOf(userRoster[i].pid) >= 0) {
                userRoster[i].selected = true;
            } else {
                userRoster[i].selected = false;
            }
        }

        for (let i = 0; i < userPicks.length; i++) {
            userPicks[i].desc = helpers.pickDesc(userPicks[i]);
        }

        return {
            userPids: inputs.userPids,
            userDpids: inputs.userDpids,
            userPicks,
            userRoster,
        };
    }
}

function updateOffers(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("tradingBlockAsk") >= 0) {
        if (inputs.offers.length === 0) {
            return {
                offers: [],
            };
        }

        return g.dbl.tx(["players", "playerStats", "draftPicks", "teams", "teamSeasons"], async tx => {
            const teams = await team.filter({
                attrs: ["abbrev", "region", "name", "strategy"],
                seasonAttrs: ["won", "lost"],
                season: g.season,
                ot: tx,
            });

            // Take the pids and dpids in each offer and get the info needed to display the offer
            const offers = await Promise.map(inputs.offers, async (offer, i) => {
                const tid = inputs.offers[i].tid;

                let players = await tx.players.index('tid').getAll(tid);
                players = players.filter(p => inputs.offers[i].pids.indexOf(p.pid) >= 0);
                players = await player.withStats(tx, players, {
                    statsSeasons: [g.season],
                    statsTid: tid,
                });
                players = player.filter(players, {
                    attrs: ["pid", "name", "age", "contract", "injury", "watch"],
                    ratings: ["ovr", "pot", "skills", "pos"],
                    stats: ["min", "pts", "trb", "ast", "per"],
                    season: g.season,
                    tid,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true,
                });

                let picks = await tx.draftPicks.index('tid').getAll(tid);
                picks = picks.filter(dp => inputs.offers[i].dpids.indexOf(dp.dpid) >= 0);
                for (let j = 0; j < picks.length; j++) {
                    picks[j].desc = helpers.pickDesc(picks[j]);
                }

                return {
                    tid,
                    abbrev: teams[tid].abbrev,
                    region: teams[tid].region,
                    name: teams[tid].name,
                    strategy: teams[tid].strategy,
                    won: teams[tid].won,
                    lost: teams[tid].lost,
                    pids: inputs.offers[i].pids,
                    dpids: inputs.offers[i].dpids,
                    warning: inputs.offers[i].warning,
                    picks,
                    players,
                };
            });

            random.shuffle(offers);

            return {
                offers,
            };
        });
    }
}

function uiFirst(vm) {
    ui.title("Trading Block");

    const tradeable = roster => {
        return roster.map(p => {
            const selected = p.selected ? ' checked = "checked"' : '';
            const disabled = p.untradable ? ' disabled = "disabled"' : '';
            const checkbox = `<input name="pids[]" type="checkbox" value="${p.pid}" title="${p.untradableMsg}"${selected}${disabled}>`;

            return [checkbox, helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.ratings.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), `${helpers.formatCurrency(p.contract.amount, "M")} thru ${p.contract.exp}`, helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1)];
        });
    };

    ko.computed(() => {
        ui.datatableSinglePage($("#roster-user"), 5, tradeable(vm.userRoster()), {
            columnDefs: [{
                orderable: false,
                targets: [0],
            }],
        });
    }).extend({throttle: 1});

    ui.tableClickableRows($("#roster-user"));

    // Clear stale results while new results are being found
    document.getElementById("ask-button").addEventListener("click", () => {
        vm.offers([]);
    });
}

module.exports = bbgmView.init({
    id: "tradingBlock",
    get,
    post,
    mapping,
    runBefore: [updateUserRoster, updateOffers],
    uiFirst,
});
