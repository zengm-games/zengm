const g = require('../globals');
const komapping = require('knockout.mapping');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const NewLeague = require('./views/NewLeague');

async function updateNewLeague() {
    let newLid = null;

    // Find most recent league and add one to the LID
    await g.dbm.leagues.iterate("prev", (l, shortCircuit) => {
        newLid = l.lid + 1;
        shortCircuit();
    });

    if (newLid === null) {
        newLid = 1;
    }

    return {
        name: `League ${newLid}`,
        lastSelectedTid: parseInt(localStorage.lastSelectedTid, 10),
    };
}

function uiFirst(vm) {
    // Handle custom roster teams
    const setTeams = newTeams => {
        if (newTeams !== undefined) {
            for (let i = 0; i < newTeams.length; i++) {
                // Is pop hidden in season, like in editTeamInfo import?
                if (!newTeams[i].hasOwnProperty("pop") && newTeams[i].hasOwnProperty("seasons")) {
                    newTeams[i].pop = newTeams[i].seasons[newTeams[i].seasons.length - 1].pop;
                }

                newTeams[i].pop = helpers.round(newTeams[i].pop, 2);
            }

            newTeams = helpers.addPopRank(newTeams);

            // Add random team
            newTeams.unshift({
                tid: -1,
                region: "Random",
                name: "Team",
            });

            komapping.fromJS({teams: newTeams}, vm);
        }
    };
    const useCustomTeams = fileEl => {
        if (fileEl.files && fileEl.files.length) {
            vm.invalidLeagueFile(false);

            const file = fileEl.files[0];

            const reader = new window.FileReader();
            reader.readAsText(file);
            reader.onload = event => {
                let leagueFile;
                try {
                    leagueFile = JSON.parse(event.target.result);
                } catch (e) {
                    console.log(e);
                    vm.invalidLeagueFile(true);
                    return;
                }

                const newTeams = leagueFile.teams;
                setTeams(newTeams);

                // Is a userTid specified?
                if (leagueFile.hasOwnProperty("gameAttributes")) {
                    leagueFile.gameAttributes.some(attribute => {
                        if (attribute.key === "userTid") {
                            // Set it to select the userTid entry
                            document.getElementById("new-league-tid").value = attribute.value;
                            return true;
                        }
                    });
                }
            };
        }
    };
    const fileEl = document.getElementById("custom-rosters-file");
    fileEl.addEventListener("change", () => setTimeout(() => useCustomTeams(fileEl), 100));
    // Handle switch away from custom roster teams
    const newLeagueRostersEl = document.getElementById("new-league-rosters");
    newLeagueRostersEl.addEventListener("change", function () {
        if (this.value === "custom-rosters") {
            useCustomTeams(fileEl);
        } else {
            setTeams(helpers.getTeamsDefault());
        }
    });
}

module.exports = bbgmViewReact.init({
    id: "newLeague",
    inLeague: false,
    runBefore: [updateNewLeague],
    Component: NewLeague,
});
