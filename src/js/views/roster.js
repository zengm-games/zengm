const g = require('../globals');
const ui = require('../ui');
const league = require('../core/league');
const player = require('../core/player');
const season = require('../core/season');
const team = require('../core/team');
const trade = require('../core/trade');
const Promise = require('bluebird');
const ko = require('knockout');
const $ = require('jquery');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const Roster = require('./views/Roster');

async function doReorder(sortedPids) {
    await g.dbl.tx("players", "readwrite", async tx => {
        // Update rosterOrder
        for (let i = 0; i < sortedPids.length; i++) {
            const p = await tx.players.get(sortedPids[i]);
            p.rosterOrder = i;
            await tx.players.put(p);
        }
    });

    league.updateLastDbChange();
}

function editableChanged(editable) {
    const rosterTbody = $("#roster tbody");

    if (!rosterTbody.is(":ui-sortable")) {
        // The first time editableChanged is called, set up sorting, but disable it by default
        $("#roster tbody").sortable({
            helper(e, ui) {
                // Return helper which preserves the width of table cells being reordered
                ui.children().each(function () {
                    $(this).width($(this).width());
                });
                return ui;
            },
            cursor: "move",
            async update() {
                const sortedPids = $(this).sortable("toArray", {attribute: "data-pid"});
                for (let i = 0; i < sortedPids.length; i++) {
                    sortedPids[i] = parseInt(sortedPids[i], 10);
                }

                await doReorder(sortedPids);
            },
            handle: ".roster-handle",
            disabled: true,
        });
    }

    if (editable) {
        rosterTbody.sortable("enable");//.disableSelection();
    } else {
        rosterTbody.sortable("disable");//.enableSelection();
    }
}

function get(req) {
    // Fix broken links
    if (req.params.abbrev === "FA") {
        return {
            redirectUrl: helpers.leagueUrl(["free_agents"]),
        };
    }

    const inputs = {};
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(req.params.abbrev);
    inputs.season = helpers.validateSeason(req.params.season);

    return inputs;
}

function InitViewModel() {
    this.ptChange = async p => {
        // NEVER UPDATE AI TEAMS
        // This shouldn't be necessary, but sometimes it gets triggered
        if (this.team.tid() !== g.userTid) {
            return;
        }

        // Update ptModifier in database
        const pid = p.pid();
        const ptModifier = parseFloat(p.ptModifier());
        const p2 = await g.dbl.players.get(pid);
        if (p2.ptModifier !== ptModifier) {
            p2.ptModifier = ptModifier;
            await g.dbl.players.put(p2);
            league.updateLastDbChange();
        }
    };
}

function updateRoster(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.abbrev !== state.abbrev || inputs.season !== state.season) {
        const vars = {
            abbrev: inputs.abbrev,
            season: inputs.season,
            editable: inputs.season === g.season && inputs.tid === g.userTid,
            salaryCap: g.salaryCap / 1000,
            showTradeFor: inputs.season === g.season && inputs.tid !== g.userTid,
            ptModifiers: [
                {text: "0", ptModifier: "0"},
                {text: "-", ptModifier: "0.75"},
                {text: " ", ptModifier: "1"},
                {text: "+", ptModifier: "1.25"},
                {text: "++", ptModifier: "1.75"},
            ],
        };

        return g.dbl.tx(["players", "playerStats", "releasedPlayers", "schedule", "teams", "teamSeasons", "teamStats"], async tx => {
            vars.team = await team.filter({
                season: inputs.season,
                tid: inputs.tid,
                attrs: ["tid", "region", "name", "strategy", "imgURL"],
                seasonAttrs: ["profit", "won", "lost", "playoffRoundsWon"],
                ot: tx,
            });

            const attrs = ["pid", "tid", "draft", "name", "age", "contract", "cashOwed", "rosterOrder", "injury", "ptModifier", "watch", "gamesUntilTradable"];  // tid and draft are used for checking if a player can be released without paying his salary
            const ratings = ["ovr", "pot", "dovr", "dpot", "skills", "pos"];
            const stats = ["gp", "min", "pts", "trb", "ast", "per", "yearsWithTeam"];

            if (inputs.season === g.season) {
                // Show players currently on the roster
                let [schedule, players, payroll] = await Promise.all([
                    season.getSchedule({ot: tx}),
                    tx.players.index('tid').getAll(inputs.tid).then(players => {
                        return player.withStats(tx, players, {
                            statsSeasons: [inputs.season],
                            statsTid: inputs.tid,
                        });
                    }),
                    team.getPayroll(tx, inputs.tid).get(0),
                ]);

                // numGamesRemaining doesn't need to be calculated except for g.userTid, but it is.
                let numGamesRemaining = 0;
                for (let i = 0; i < schedule.length; i++) {
                    if (inputs.tid === schedule[i].homeTid || inputs.tid === schedule[i].awayTid) {
                        numGamesRemaining += 1;
                    }
                }

                players = player.filter(players, {
                    attrs,
                    ratings,
                    stats,
                    season: inputs.season,
                    tid: inputs.tid,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true,
                    numGamesRemaining,
                });
                players.sort((a, b) => a.rosterOrder - b.rosterOrder);

                // Add untradable property
                players = trade.filterUntradable(players);

                for (let i = 0; i < players.length; i++) {
                    // Can release from user's team, except in playoffs because then no free agents can be signed to meet the minimum roster requirement
                    if (inputs.tid === g.userTid && (g.phase !== g.PHASE.PLAYOFFS || players.length > 15) && !g.gameOver && players.length > 5) {
                        players[i].canRelease = true;
                    } else {
                        players[i].canRelease = false;
                    }

                    // Convert ptModifier to string so it doesn't cause unneeded knockout re-rendering
                    players[i].ptModifier = String(players[i].ptModifier);
                }

                vars.players = players;
                vars.payroll = payroll / 1000;
            } else {
                // Show all players with stats for the given team and year
                // Needs all seasons because of YWT!
                let players = tx.players.index('statsTids').getAll(inputs.tid);
                players = await player.withStats(tx, players, {
                    statsSeasons: "all",
                    statsTid: inputs.tid,
                });

                players = player.filter(players, {
                    attrs,
                    ratings,
                    stats,
                    season: inputs.season,
                    tid: inputs.tid,
                    fuzz: true,
                });
                players.sort((a, b) => b.stats.gp * b.stats.min - a.stats.gp * a.stats.min);

                // This is not immediately needed, because players from past seasons don't have the "Trade For" button displayed. However, if an old season is loaded first and then a new season is switched to, Knockout will try to display the Trade For button before all the player objects are updated to include it. I think it might be the komapping.fromJS part from bbgmView not applying everything at exactly the same time.
                players = trade.filterUntradable(players);

                for (let i = 0; i < players.length; i++) {
                    players[i].age = players[i].age - (g.season - inputs.season);
                    players[i].canRelease = false;
                }

                vars.players = players;
                vars.payroll = null;
            }

            return vars;
        });
    }
}

function uiFirst(vm) {
    $("#roster").on("change", "select", function () {
        // Update select color

        // NEVER UPDATE AI TEAMS
        // This shouldn't be necessary, but sometimes it gets triggered
        if (vm.team.tid() !== g.userTid) {
            return;
        }

        // These don't work in Firefox, so do it manually
//            backgroundColor = $('option:selected', this).css('background-color');
//            color = $('option:selected', this).css('color');
        let backgroundColor, color;
        if (this.value === "1") {
            backgroundColor = "#ccc";
            color = "#000";
        } else if (this.value === "1.75") {
            backgroundColor = "#070";
            color = "#fff";
        } else if (this.value === "1.25") {
            backgroundColor = "#0f0";
            color = "#000";
        } else if (this.value === "0.75") {
            backgroundColor = "#ff0";
            color = "#000";
        } else if (this.value === "0") {
            backgroundColor = "#a00";
            color = "#fff";
        }

        this.style.color = color;
        this.style.backgroundColor = backgroundColor;
    });
}

module.exports = bbgmViewReact.init({
    id: "roster",
    get,
    runBefore: [updateRoster],
    Component: Roster,
});
