const g = require('../globals');
const ui = require('../ui');
const draft = require('../core/draft');
const finances = require('../core/finances');
const player = require('../core/player');
const backboard = require('backboard');
const Promise = require('bluebird');
const $ = require('jquery');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

async function addSeason(season, tid) {
    let playersAll = await g.dbl.players.index('tid').getAll(tid);

    playersAll = player.filter(playersAll, {
        attrs: ["pid", "firstName", "lastName", "age", "watch", "valueFuzz"],
        ratings: ["ovr", "pot", "skills", "fuzz", "pos"],
        showNoStats: true,
        showRookies: true,
        fuzz: true
    });

    const players = [];
    for (let i = 0; i < playersAll.length; i++) {
        const pa = playersAll[i];

        // Abbreviate first name to prevent overflows
        pa.name = `${pa.firstName.split(" ").map(function(s) { return s[0]; }).join(".")}. ${pa.lastName}`;

        // Attributes
        const p = {pid: pa.pid, name: pa.name, age: pa.age, watch: pa.watch, valueFuzz: pa.valueFuzz};

        // Ratings - just take the only entry
        p.ovr = pa.ratings[0].ovr;
        p.pot = pa.ratings[0].pot;
        p.skills = pa.ratings[0].skills;
        p.pos = pa.ratings[0].pos;

        players.push(p);
    }

    // Rank prospects
    players.sort((a, b) => b.valueFuzz - a.valueFuzz);
    for (let i = 0; i < players.length; i++) {
        players[i].rank = i + 1;
    }

    return {
        players,
        season
    };
}

const mapping = {
    seasons: {
        create: options => options.data
    }
};

async function updateDraftScouting(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("dbChange") >= 0) {
        // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
        const seasonOffset = g.phase < g.PHASE.FREE_AGENCY ? 0 : 1;

        // In fantasy draft, use temp tid
        const firstUndraftedTid = g.phase === g.PHASE.FANTASY_DRAFT ? g.PLAYER.UNDRAFTED_FANTASY_TEMP : g.PLAYER.UNDRAFTED;

        const seasons = await Promise.all([
            addSeason(g.season + seasonOffset, firstUndraftedTid),
            addSeason(g.season + seasonOffset + 1, g.PLAYER.UNDRAFTED_2),
            addSeason(g.season + seasonOffset + 2, g.PLAYER.UNDRAFTED_3)
        ]);

        return {
            seasons
        };
    }
}

function customDraftClassHandler(e) {
    const seasonOffset = parseInt(e.target.dataset.index, 10);
    const file = e.target.files[0];

    // What tid to replace?
    let draftClassTid;
    if (seasonOffset === 0) {
        draftClassTid = g.PLAYER.UNDRAFTED;
    } else if (seasonOffset === 1) {
        draftClassTid = g.PLAYER.UNDRAFTED_2;
    } else if (seasonOffset === 2) {
        draftClassTid = g.PLAYER.UNDRAFTED_3;
    } else {
        throw new Error("Invalid draft class index");
    }

    const reader = new window.FileReader();
    reader.readAsText(file);
    reader.onload = async event => {
        const uploadedFile = JSON.parse(event.target.result);

        // Get all players from uploaded files
        let players = uploadedFile.players;

        // Filter out any that are not draft prospects
        players = players.filter(p => p.tid === g.PLAYER.UNDRAFTED);

        // Get scouting rank, which is used in a couple places below
        const teamSeasons = await g.dbl.teamSeasons.index("tid, season").getAll(backboard.bound([g.userTid, g.season - 2], [g.userTid, g.season]));

        const scoutingRank = finances.getRankLastThree(teamSeasons, "expenses", "scouting");

        // Delete old players from draft class
        await g.dbl.tx(["players", "playerStats"], "readwrite", async tx => {
            await tx.players.index('tid').iterate(draftClassTid, p => tx.players.delete(p.pid));

            // Find season from uploaded file, for age adjusting
            let uploadedSeason;
            if (uploadedFile.hasOwnProperty("gameAttributes")) {
                for (let i = 0; i < uploadedFile.gameAttributes.length; i++) {
                    if (uploadedFile.gameAttributes[i].key === "season") {
                        uploadedSeason = uploadedFile.gameAttributes[i].value;
                        break;
                    }
                }
            } else if (uploadedFile.hasOwnProperty("startingSeason")) {
                uploadedSeason = uploadedFile.startingSeason;
            }

            let seasonOffset2 = seasonOffset;
            if (g.phase >= g.PHASE.FREE_AGENCY) {
                // Already generated next year's draft, so bump up one
                seasonOffset2 += 1;
            }

            const draftYear = g.season + seasonOffset2;

            // Add new players to database
            await Promise.map(players, async p => {
                // Make sure player object is fully defined
                p = player.augmentPartialPlayer(p, scoutingRank);

                // Manually set TID, since at this point it is always g.PLAYER.UNDRAFTED
                p.tid = draftClassTid;

                // Manually remove PID, since all it can do is cause trouble
                if (p.hasOwnProperty("pid")) {
                    delete p.pid;
                }

                // Adjust age
                if (uploadedSeason !== undefined) {
                    p.born.year += g.season - uploadedSeason + seasonOffset2;
                }

                // Adjust seasons
                p.ratings[0].season = draftYear;
                p.draft.year = draftYear;

                // Don't want lingering stats vector in player objects, and draft prospects don't have any stats
                delete p.stats;

                p = await player.updateValues(tx, p, []);
                await tx.players.put(p);
            });

            // "Top off" the draft class if <70 players imported
            if (players.length < 70) {
                await draft.genPlayers(tx, draftClassTid, scoutingRank, 70 - players.length);
            }
        });

        ui.realtimeUpdate(["dbChange"]);
    };
}

function uiFirst(vm) {
    ui.title("Draft Scouting");

    ko.computed(() => {
        const seasons = vm.seasons();
        for (let i = 0; i < seasons.length; i++) {
            ui.datatableSinglePage($(`#draft-scouting-${i}`), 4, seasons[i].players.map(p => {
                return [String(p.rank), helpers.playerNameLabels(p.pid, p.name, undefined, p.skills, p.watch), p.pos, String(p.age), String(p.ovr), String(p.pot)];
            }));
        }
    }).extend({throttle: 1});

    ui.tableClickableRows($("#draft-scouting"));
}

function uiEvery() {
    // Handle custom roster buttons - this needs to be in uiEvery or it's lost when page reloads
    // This could somehow lead to double calling customDraftClassHandler, but that doesn't seem to actually happen
    const uploadFileButtons = document.getElementsByClassName("custom-draft-class");
    for (let i = 0; i < uploadFileButtons.length; i++) {
        uploadFileButtons[i].addEventListener("change", customDraftClassHandler);
    }

    // Same uiEvery rationale as above
    document.getElementById("toggle-0").addEventListener("click", function (e) {
        e.preventDefault();
        this.style.display = "none";
        document.getElementById("form-0").style.display = "block";
    });
    document.getElementById("toggle-1").addEventListener("click", function (e) {
        e.preventDefault();
        this.style.display = "none";
        document.getElementById("form-1").style.display = "block";
    });
    document.getElementById("toggle-2").addEventListener("click", function (e) {
        e.preventDefault();
        this.style.display = "none";
        document.getElementById("form-2").style.display = "block";
    });
}

module.exports = bbgmView.init({
    id: "draftScouting",
    mapping,
    runBefore: [updateDraftScouting],
    uiFirst,
    uiEvery
});
