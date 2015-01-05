/**
 * @name views.playoffs
 * @namespace Show current or archived playoffs, or projected matchups for an in-progress season.
 */
define(["dao", "globals", "ui", "core/draft", "core/player", "lib/bluebird", "lib/jquery", "util/bbgmView", "util/helpers"], function (dao, g, ui, draft, player, Promise, $, bbgmView, helpers) {
    "use strict";

    function updateDraftTables(pids) {
        var draftedPlayer, draftedRows, i, j, jMax, undraftedTds;

        for (i = 0; i < pids.length; i++) {
            draftedPlayer = [];
            // Find row in undrafted players table, get metadata, delete row
            undraftedTds = $("#undrafted-" + pids[i] + " td");
            jMax = g.phase === g.PHASE.FANTASY_DRAFT ? 8 : 5;
            for (j = 0; j < jMax; j++) {
                draftedPlayer[j] = undraftedTds[j].innerHTML;
            }

            // Find correct row (first blank row) in drafted players table, write metadata
            draftedRows = $("#drafted tbody tr");
            for (j = 0; j < draftedRows.length; j++) {
                if (draftedRows[j].children[3].innerHTML.length === 0) {
                    $("#undrafted-" + pids[i]).remove();
                    draftedRows[j].children[2].innerHTML = draftedPlayer[0];
                    draftedRows[j].children[3].innerHTML = draftedPlayer[1];
                    draftedRows[j].children[4].innerHTML = draftedPlayer[2];
                    draftedRows[j].children[5].innerHTML = draftedPlayer[3];
                    draftedRows[j].children[6].innerHTML = draftedPlayer[4];
                    if (g.phase === g.PHASE.FANTASY_DRAFT) {
                        draftedRows[j].children[7].innerHTML = draftedPlayer[5];
                        draftedRows[j].children[8].innerHTML = draftedPlayer[6];
                        draftedRows[j].children[9].innerHTML = draftedPlayer[7];
                    }
                    break;
                }
            }
        }
    }

    function draftUser(pid) {
        return draft.getOrder().then(function (draftOrder) {
            var pick;

            pick = draftOrder.shift();
            if (pick.tid === g.userTid) {
                return draft.selectPlayer(pick, pid).then(function () {
                    return draft.setOrder(draftOrder).then(function () {
                        return pid;
                    });
                });
            }

            console.log("ERROR: User trying to draft out of turn.");
        });
    }

    function draftUntilUserOrEnd() {
        ui.updateStatus("Draft in progress...");
        draft.untilUserOrEnd().then(function (pids) {
            draft.getOrder().then(function (draftOrder) {
                var done;

                done = false;
                if (draftOrder.length === 0) {
                    done = true;
                    ui.updateStatus("Idle");

                    $("#undrafted th:last-child, #undrafted td:last-child").remove();
                }

                updateDraftTables(pids);
                if (!done) {
                    $("#undrafted button").removeAttr("disabled");
                }
            });
        });
    }

    function get() {
        if (g.phase !== g.PHASE.DRAFT && g.phase !== g.PHASE.FANTASY_DRAFT) {
            return {
                redirectUrl: helpers.leagueUrl(["draft_summary"])
            };
        }
    }

    function updateDraft() {
        return Promise.all([
            dao.players.getAll({
                index: "tid",
                key: g.PLAYER.UNDRAFTED,
                statsSeasons: [g.season]
            }),
            dao.players.getAll({
                index: "draft.year",
                key: g.season,
                statsSeasons: [g.season]
            })
        ]).spread(function (undrafted, players) {
            var drafted, i, started;

            undrafted.sort(function (a, b) { return b.valueFuzz - a.valueFuzz; });
            undrafted = player.filter(undrafted, {
                attrs: ["pid", "name", "pos", "age", "injury", "contract", "watch"],
                ratings: ["ovr", "pot", "skills"],
                stats: ["per", "ewa"],
                season: g.season,
                showNoStats: true,
                showRookies: true,
                fuzz: true
            });

            players = player.filter(players, {
                attrs: ["pid", "tid", "name", "pos", "age", "draft", "injury", "contract", "watch"],
                ratings: ["ovr", "pot", "skills"],
                stats: ["per", "ewa"],
                season: g.season,
                showRookies: true,
                fuzz: true
            });

            drafted = [];
            for (i = 0; i < players.length; i++) {
                if (players[i].tid >= 0) {
                    drafted.push(players[i]);
                }
            }
            drafted.sort(function (a, b) { return (100 * a.draft.round + a.draft.pick) - (100 * b.draft.round + b.draft.pick); });

            started = drafted.length > 0;

            return draft.getOrder().then(function (draftOrder) {
                var i, slot;

                for (i = 0; i < draftOrder.length; i++) {
                    slot = draftOrder[i];
                    drafted.push({
                        draft: {
                            tid: slot.tid,
                            originalTid: slot.originalTid,
                            round: slot.round,
                            pick: slot.pick
                        },
                        pid: -1
                    });
                }

                return {
                    undrafted: undrafted,
                    drafted: drafted,
                    started: started,
                    fantasyDraft: g.phase === g.PHASE.FANTASY_DRAFT
                };
            });
        });
    }

    function uiFirst() {
        var startDraft, undraftedContainer;

        ui.title("Draft");

        startDraft = $("#start-draft");
        startDraft.click(function () {
            $(startDraft.parent()).hide();
            draftUntilUserOrEnd();
        });

        $("#undrafted").on("click", "button", function () {
            $("#undrafted button").attr("disabled", "disabled");
            draftUser(parseInt(this.getAttribute("data-player-id"), 10)).then(function (pid) {
                updateDraftTables([pid]);
                draftUntilUserOrEnd();
            });
        });

        $("#view-drafted").click(function () {
            $("body, html").animate({scrollLeft: $(document).outerWidth() - $(window).width()}, 250);
        });
        $("#view-undrafted").click(function () {
            $("body, html").animate({scrollLeft: 0}, 250);
        });

        // Scroll undrafted to the right, so "Draft" button is never cut off
        undraftedContainer = document.getElementById("undrafted").parentNode;
        undraftedContainer.scrollLeft = undraftedContainer.scrollWidth;

        ui.tableClickableRows($("#undrafted"));
        ui.tableClickableRows($("#drafted"));

        // If this is a fantasy draft, make everybody use two screens to save space
        if (g.phase === g.PHASE.FANTASY_DRAFT) {
            $("#undrafted-col").removeClass("col-sm-6").addClass("col-xs-12");
            $("#drafted-col").removeClass("col-sm-6").addClass("col-xs-12");

            $(".row-offcanvas").addClass("row-offcanvas-force");
            $(".row-offcanvas-right").addClass("row-offcanvas-right-force");
            $(".sidebar-offcanvas").addClass("sidebar-offcanvas-force");

            $("#view-drafted").removeClass("visible-xs");
            $("#view-undrafted").removeClass("visible-xs");
        }
    }

    return bbgmView.init({
        id: "draft",
        get: get,
        runBefore: [updateDraft],
        uiFirst: uiFirst
    });
});