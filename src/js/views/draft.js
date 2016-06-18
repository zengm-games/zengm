const g = require('../globals');
const ui = require('../ui');
const draft = require('../core/draft');
const player = require('../core/player');
const Promise = require('bluebird');
const $ = require('jquery');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

function updateDraftTables(pids) {
    for (let i = 0; i < pids.length; i++) {
        const draftedPlayer = [];
        // Find row in undrafted players table, get metadata, delete row
        const undraftedTds = $(`#undrafted-${pids[i]} td`);
        const jMax = g.phase === g.PHASE.FANTASY_DRAFT ? 8 : 5;
        for (let j = 0; j < jMax; j++) {
            draftedPlayer[j] = undraftedTds[j].innerHTML;
        }

        // Find correct row (first blank row) in drafted players table, write metadata
        const draftedRows = $("#drafted tbody tr");
        for (let j = 0; j < draftedRows.length; j++) {
            if (draftedRows[j].children[3].innerHTML.length === 0) {
                $(`#undrafted-${pids[i]}`).remove();
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

async function draftUser(pid) {
    const draftOrder = await draft.getOrder();
    const pick = draftOrder.shift();
    if (g.userTids.indexOf(pick.tid) >= 0) {
        await draft.selectPlayer(pick, pid);
        await g.dbl.tx("draftOrder", "readwrite", tx => draft.setOrder(tx, draftOrder));
        return pid;
    }

    console.log("ERROR: User trying to draft out of turn.");
}

async function draftUntilUserOrEnd() {
    ui.updateStatus("Draft in progress...");
    const pids = await draft.untilUserOrEnd();
    const draftOrder = await draft.getOrder();

    let done = false;
    if (draftOrder.length === 0) {
        done = true;
        ui.updateStatus("Idle");

        $("#undrafted th:last-child, #undrafted td:last-child").remove();
    }

    updateDraftTables(pids);
    if (!done) {
        $("#undrafted button").removeAttr("disabled");
    }
}

function get() {
    if (g.phase !== g.PHASE.DRAFT && g.phase !== g.PHASE.FANTASY_DRAFT) {
        return {
            redirectUrl: helpers.leagueUrl(["draft_summary"]),
        };
    }
}

async function updateDraft() {
    // DIRTY QUICK FIX FOR v10 db upgrade bug - eventually remove
    // This isn't just for v10 db upgrade! Needed the same fix for http://www.reddit.com/r/BasketballGM/comments/2tf5ya/draft_bug/cnz58m2?context=3 - draft class not always generated with the correct seasons
    await g.dbl.tx("players", "readwrite", async tx => {
        const p = await tx.players.index('tid').get(g.PLAYER.UNDRAFTED);
        const season = p.ratings[0].season;
        if (season !== g.season && g.phase === g.PHASE.DRAFT) {
            console.log("FIXING FUCKED UP DRAFT CLASS");
            console.log(season);
            await tx.players.index('tid').iterate(g.PLAYER.UNDRAFTED, p => {
                p.ratings[0].season = g.season;
                p.draft.year = g.season;
                return p;
            });
        }
    });

    let [undrafted, players] = await Promise.all([
        g.dbl.players.index('tid').getAll(g.PLAYER.UNDRAFTED).then(players => {
            return player.withStats(null, players, {
                statsSeasons: [g.season],
            });
        }),
        g.dbl.players.index('draft.year').getAll(g.season).then(players => {
            return player.withStats(null, players, {
                statsSeasons: [g.season],
            });
        }),
    ]);

    undrafted.sort((a, b) => b.valueFuzz - a.valueFuzz);
    undrafted = player.filter(undrafted, {
        attrs: ["pid", "name", "age", "injury", "contract", "watch"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["per", "ewa"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    players = player.filter(players, {
        attrs: ["pid", "tid", "name", "age", "draft", "injury", "contract", "watch"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["per", "ewa"],
        season: g.season,
        showRookies: true,
        fuzz: true,
    });

    const drafted = [];
    for (let i = 0; i < players.length; i++) {
        if (players[i].tid >= 0) {
            drafted.push(players[i]);
        }
    }
    drafted.sort((a, b) => (100 * a.draft.round + a.draft.pick) - (100 * b.draft.round + b.draft.pick));

    const started = drafted.length > 0;

    const draftOrder = await draft.getOrder();
    for (let i = 0; i < draftOrder.length; i++) {
        const slot = draftOrder[i];
        drafted.push({
            draft: {
                tid: slot.tid,
                originalTid: slot.originalTid,
                round: slot.round,
                pick: slot.pick,
            },
            pid: -1,
        });
    }

    return {
        undrafted,
        drafted,
        started,
        fantasyDraft: g.phase === g.PHASE.FANTASY_DRAFT,
        userTids: g.userTids,
    };
}

function uiFirst() {
    ui.title("Draft");

    const startDraft = $("#start-draft");
    startDraft.click(() => {
        $(startDraft.parent()).hide();
        draftUntilUserOrEnd();
    });

    $("#undrafted").on("click", "button", async function () {
        $("#undrafted button").attr("disabled", "disabled");
        const pid = await draftUser(parseInt(this.getAttribute("data-player-id"), 10));
        updateDraftTables([pid]);
        draftUntilUserOrEnd();
    });

    $("#view-drafted").click(() => {
        $("body, html").animate({scrollLeft: $(document).outerWidth() - $(window).width()}, 250);
    });
    $("#view-undrafted").click(() => {
        $("body, html").animate({scrollLeft: 0}, 250);
    });

    // Scroll undrafted to the right, so "Draft" button is never cut off
    const undraftedContainer = document.getElementById("undrafted").parentNode;
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

module.exports = bbgmView.init({
    id: "draft",
    get,
    runBefore: [updateDraft],
    uiFirst,
});
