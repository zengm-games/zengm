const g = require('../globals');
const ui = require('../ui');
const league = require('../core/league');
const team = require('../core/team');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

function get() {
    if (!g.godMode) {
        return {
            errorMessage: `You can't edit teams unless you enable <a href="${helpers.leagueUrl(["god_mode"])}">God Mode</a>.`
        };
    }
}

async function post(req) {
    const button = document.getElementById("edit-team-info");
    button.disabled = true;

    let userName, userRegion;
    await g.dbl.tx(['teams', 'teamSeasons'], 'readwrite', tx => {
        return tx.teams.iterate(async t => {
            t.abbrev = req.params.abbrev[t.tid];
            t.region = req.params.region[t.tid];
            t.name = req.params.name[t.tid];
            t.imgURL = req.params.imgURL[t.tid];

            if (t.tid === g.userTid) {
                userName = t.name;
                userRegion = t.region;
            }

            const teamSeason = await tx.teamSeasons.index('season, tid').get([g.season, t.tid]);
            teamSeason.pop = parseFloat(req.params.pop[t.tid]);
            await tx.teamSeasons.put(teamSeason);

            return t;
        });
    });

    await league.updateMetaNameRegion(userName, userRegion);

    await league.setGameAttributesComplete({
        teamAbbrevsCache: req.params.abbrev,
        teamRegionsCache: req.params.region,
        teamNamesCache: req.params.name
    });

    league.updateLastDbChange();
    button.disabled = false;
    ui.realtimeUpdate([], helpers.leagueUrl(["edit_team_info"]));
}

async function updateTeamInfo() {
    const teams = await team.filter({
        attrs: ["tid", "abbrev", "region", "name", "imgURL"],
        seasonAttrs: ["pop"],
        season: g.season
    });

    for (let i = 0; i < teams.length; i++) {
        teams[i].pop = helpers.round(teams[i].pop, 6);
    }

    return {
        teams
    };
}

function uiFirst() {
    ui.title("Edit Team Names");

    const fileEl = document.getElementById("custom-teams");
    fileEl.addEventListener("change", () => {
        const file = fileEl.files[0];

        const reader = new window.FileReader();
        reader.readAsText(file);
        reader.onload = async event => {
            const rosters = JSON.parse(event.target.result);
            const newTeams = rosters.teams;

            // Validate teams
            if (newTeams.length < g.numTeams) {
                console.log("ROSTER ERROR: Wrong number of teams");
                return;
            }
            for (let i = 0; i < newTeams.length; i++) {
                if (i !== newTeams[i].tid) {
                    console.log(`ROSTER ERROR: Wrong tid, team ${i}`);
                    return;
                }
                if (newTeams[i].cid < 0 || newTeams[i].cid > 1) {
                    console.log(`ROSTER ERROR: Invalid cid, team ${i}`);
                    return;
                }
                if (newTeams[i].did < 0 || newTeams[i].did > 5) {
                    console.log(`ROSTER ERROR: Invalid did, team ${i}`);
                    return;
                }
                if (typeof newTeams[i].region !== "string") {
                    console.log(`ROSTER ERROR: Invalid region, team ${i}`);
                    return;
                }
                if (typeof newTeams[i].name !== "string") {
                    console.log(`ROSTER ERROR: Invalid name, team ${i}`);
                    return;
                }
                if (typeof newTeams[i].abbrev !== "string") {
                    console.log(`ROSTER ERROR: Invalid abbrev, team ${i}`);
                    return;
                }

                // Check for pop in either the root or the most recent season
                if (!newTeams[i].hasOwnProperty("pop") && newTeams[i].hasOwnProperty("seasons")) {
                    newTeams[i].pop = newTeams[i].seasons[newTeams[i].seasons.length - 1].pop;
                }

                if (typeof newTeams[i].pop !== "number") {
                    console.log(`ROSTER ERROR: Invalid pop, team ${i}`);
                    return;
                }
            }

            let userName, userRegion;
            await g.dbl.tx(['teams', 'teamSeasons'], 'readwrite', tx => {
                return tx.teams.iterate(async t => {
                    t.cid = newTeams[t.tid].cid;
                    t.did = newTeams[t.tid].did;
                    t.region = newTeams[t.tid].region;
                    t.name = newTeams[t.tid].name;
                    t.abbrev = newTeams[t.tid].abbrev;
                    if (newTeams[t.tid].imgURL) {
                        t.imgURL = newTeams[t.tid].imgURL;
                    }

                    if (t.tid === g.userTid) {
                        userName = t.name;
                        userRegion = t.region;
                    }

                    const teamSeason = await tx.teamSeasons.index('season, tid').get([g.season, t.tid]);
                    teamSeason.pop = newTeams[t.tid].pop;
                    await tx.teamSeasons.put(teamSeason);

                    return t;
                });
            });

            await league.updateMetaNameRegion(userName, userRegion);

            await league.setGameAttributesComplete({
                teamAbbrevsCache: newTeams.map(t => t.abbrev),
                teamRegionsCache: newTeams.map(t => t.region),
                teamNamesCache: newTeams.map(t => t.name)
            });

            league.updateLastDbChange();
            ui.realtimeUpdate(["dbChange"]);
        };
    });
}

module.exports = bbgmView.init({
    id: "editTeamInfo",
    get,
    post,
    runBefore: [updateTeamInfo],
    uiFirst
});
