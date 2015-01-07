/**
 * @name views.tradingBlock
 * @namespace Trading block.
 */
define(["dao", "globals", "ui", "core/player", "core/team", "core/trade", "lib/bluebird", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/random"], function (dao, g, ui, player, team, trade, Promise, $, ko, _, bbgmView, helpers, random) {
    "use strict";

    var mapping;

    function getOffers(userPids, userDpids) {
        var progressBar, tids;

        // Initialize progress bar
        progressBar = document.querySelector("#ask-progress .progress-bar");
        progressBar.style.width = "10%";

        // Pick 10 random teams to try
        tids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
        random.shuffle(tids);
        tids.splice(11, 19);

        return trade.getPickValues().then(function (estValues) {
            var done, numTeams, promises;

            // For width of progress bar
            numTeams = tids.length;
            if (tids.indexOf(g.userTid) >= 0) {
                numTeams -= 1;
            }
            done = 0;

            promises = [];
            tids.forEach(function (tid) {
                var teams;

                teams = [
                    {
                        tid: g.userTid,
                        pids: userPids,
                        dpids: userDpids
                    },
                    {
                        tid: tid,
                        pids: [],
                        dpids: []
                    }
                ];

                if (tid !== g.userTid) {
                    promises.push(trade.makeItWork(teams, true, estValues).spread(function (found, teams) {
                        // Update progress bar
                        done += 1;
                        progressBar.style.width = Math.round(10 + 90 * done / numTeams) + "%";

                        if (found) {
                            return trade.summary(teams).then(function (summary) {
                                teams[1].warning = summary.warning;
                                return teams[1];
                            });
                        }
                    }));
                }
            });

            return Promise.all(promises).then(function (offers) {
                // Only return actual offers
                return offers.filter(function (offer) {
                    return offer !== undefined;
                });
            });
        });
    }

    function get(req) {
        if (g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.PLAYOFFS) {
            return {
                errorMessage: "You're not allowed to make trades now."
            };
        }

        return {
            userPids: req.raw.userPids !== undefined ? req.raw.userPids : [],
            userDpids: req.raw.userDpids !== undefined ? req.raw.userDpids : [],
            offers: req.raw.offers !== undefined ? req.raw.offers : []
        };
    }

    function post(req) {
        var buttonEl, progressEl, userDpids, userPids;

        buttonEl = document.getElementById("ask-button");
        buttonEl.style.display = "none";
        progressEl = document.getElementById("ask-progress");
        progressEl.style.display = "block";

        userPids = _.map(req.params.pids, function (x) { return parseInt(x, 10); });
        userDpids = _.map(req.params.dpids, function (x) { return parseInt(x, 10); });

        getOffers(userPids, userDpids).then(function (offers) {
            ui.realtimeUpdate(["tradingBlockAsk"], helpers.leagueUrl(["trading_block"]), function () {
                buttonEl.style.display = "inline";
                progressEl.style.display = "none";

                window.setTimeout(function () {
                    var tableEls;

                    // Ugly hack, since there is no good way to do this (bbgmView needs better signals.. curse of rolling your own)
                    tableEls = $(".offer-players");
                    if (tableEls.length > 0 && !tableEls[0].classList.contains("table-hover")) {
                        ui.tableClickableRows(tableEls);
                    }
                }, 500);
            }, {
                userPids: userPids,
                userDpids: userDpids,
                offers: offers
            });
        });
    }

    mapping = {
        userPicks: {
            create: function (options) {
                return options.data;
            }
        },
        userRoster: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateUserRoster(inputs, updateEvents) {
        if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("tradingBlockAsk") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("gameSim") >= 0) {
            return Promise.all([
                dao.players.getAll({
                    index: "tid",
                    key: g.userTid,
                    statsSeasons: [g.season],
                    statsTid: g.userTid
                }),
                dao.draftPicks.getAll({
                    index: "tid",
                    key: g.userTid
                })
            ]).spread(function (userRoster, userPicks) {
                var i;

                userRoster = player.filter(userRoster, {
                    attrs: ["pid", "name", "pos", "age", "contract", "injury", "watch", "gamesUntilTradable"],
                    ratings: ["ovr", "pot", "skills"],
                    stats: ["min", "pts", "trb", "ast", "per"],
                    season: g.season,
                    tid: g.userTid,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true
                });
                userRoster = trade.filterUntradable(userRoster);
                for (i = 0; i < userRoster.length; i++) {
                    if (inputs.userPids.indexOf(userRoster[i].pid) >= 0) {
                        userRoster[i].selected = true;
                    } else {
                        userRoster[i].selected = false;
                    }
                }

                for (i = 0; i < userPicks.length; i++) {
                    userPicks[i].desc = helpers.pickDesc(userPicks[i]);
                }

                return {
                    userPids: inputs.userPids,
                    userDpids: inputs.userDpids,
                    userPicks: userPicks,
                    userRoster: userRoster
                };
            });
        }
    }

    function updateOffers(inputs, updateEvents) {
        var offers, tx;

        if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("tradingBlockAsk") >= 0) {
            offers = [];

            if (inputs.offers.length === 0) {
                return {
                    offers: offers
                };
            }

            tx = dao.tx(["players", "playerStats", "draftPicks", "teams"]);

            return team.filter({
                attrs: ["abbrev", "region", "name", "strategy"],
                seasonAttrs: ["won", "lost"],
                season: g.season,
                ot: tx
            }).then(function (teams) {
                var i, promises;

                promises = [];

                // Take the pids and dpids in each offer and get the info needed to display the offer
                for (i = 0; i < inputs.offers.length; i++) {
                    (function (i) {
                        var tid;

                        tid = inputs.offers[i].tid;

                        offers[i] = {
                            tid: tid,
                            abbrev: teams[tid].abbrev,
                            region: teams[tid].region,
                            name: teams[tid].name,
                            strategy: teams[tid].strategy,
                            won: teams[tid].won,
                            lost: teams[tid].lost,
                            pids: inputs.offers[i].pids,
                            dpids: inputs.offers[i].dpids,
                            warning: inputs.offers[i].warning
                        };

                        promises.push(dao.players.getAll({
                            ot: tx,
                            index: "tid",
                            key: tid,
                            statsSeasons: [g.season],
                            statsTid: tid,
                            filter: function (p) {
                                return inputs.offers[i].pids.indexOf(p.pid) >= 0;
                            }
                        }).then(function (players) {
                            offers[i].players = player.filter(players, {
                                attrs: ["pid", "name", "pos", "age", "contract", "injury", "watch"],
                                ratings: ["ovr", "pot", "skills"],
                                stats: ["min", "pts", "trb", "ast", "per"],
                                season: g.season,
                                tid: tid,
                                showNoStats: true,
                                showRookies: true,
                                fuzz: true
                            });
                        }));

                        promises.push(dao.draftPicks.getAll({
                            ot: tx,
                            index: "tid",
                            key: tid
                        }).then(function (picks) {
                            var j;

                            picks = picks.filter(function (dp) { return inputs.offers[i].dpids.indexOf(dp.dpid) >= 0; });
                            for (j = 0; j < picks.length; j++) {
                                picks[j].desc = helpers.pickDesc(picks[j]);
                            }

                            offers[i].picks = picks;
                        }));
                    }(i));
                }

                return Promise.all(promises);
            }).then(function () {
                random.shuffle(offers);

                return {
                    offers: offers
                };
            });
        }
    }

    function uiFirst(vm) {
        var tradeable;

        ui.title("Trading Block");

        tradeable = function (roster) {
            var playersAndPicks;

            playersAndPicks = roster.map(function (p) {
                var checkbox, disabled, selected;

                if (p.selected) {
                    selected = ' checked = "checked"';
                }
                if (p.untradable) {
                    disabled = ' disabled = "disabled"';
                }

                checkbox = '<input name="pids[]" type="checkbox" value="' + p.pid + '" title="' + p.untradableMsg + '"' + selected + disabled + '>';

                return [checkbox, helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1)];
            });

            return playersAndPicks;
        };

        ko.computed(function () {
            ui.datatableSinglePage($("#roster-user"), 5, tradeable(vm.userRoster()),
                                   {aoColumnDefs: [{bSortable: false, aTargets: [0]}]});
        }).extend({throttle: 1});

        ui.tableClickableRows($("#roster-user"));

        // Clear stale results while new results are being found
        document.getElementById("ask-button").addEventListener("click", function () {
            vm.offers([]);
        });
    }

    return bbgmView.init({
        id: "tradingBlock",
        get: get,
        post: post,
        mapping: mapping,
        runBefore: [updateUserRoster, updateOffers],
        uiFirst: uiFirst
    });
});