const g = require('../globals');
const ui = require('../ui');
const league = require('../core/league');
const bbgmView = require('../util/bbgmView');

function get(req) {
    return {
        lid: parseInt(req.params.lid, 10)
    };
}

async function post(req) {
    const deleteOldDataEl = document.getElementById("delete-old-data");
    deleteOldDataEl.disabled = true;

    const deleteOldDataSuccessEl = document.getElementById("delete-old-data-success");
    deleteOldDataSuccessEl.style.visibility = "hidden";

    await g.dbl.tx(["games", "teams", "teamSeasons", "teamStats", "players", "playerStats"], "readwrite", async tx => {
        if (req.params.hasOwnProperty("boxScores")) {
            await tx.games.clear();
        }

        if (req.params.hasOwnProperty("teamHistory")) {
            await tx.teamSeasons.iterate(teamSeason => {
                if (teamSeason.season < g.season) {
                    return tx.teamSeasons.delete(teamSeason.rid);
                }
            });
        }

        if (req.params.hasOwnProperty("teamStats")) {
            await tx.teamStats.iterate(teamStats => {
                if (teamStats.season < g.season) {
                    return tx.teamStats.delete(teamStats.rid);
                }
            });
        }

        if (req.params.hasOwnProperty("retiredPlayers")) {
            const toDelete = [];

            await tx.players.index('tid').iterate(g.PLAYER.RETIRED, p => {
                toDelete.push(p.pid);
                return tx.players.delete(p.pid);
            });
            await tx.playerStats.iterate(ps => {
                if (toDelete.indexOf(ps.pid) >= 0) {
                    return tx.playerStats.delete(ps.psid);
                }
            });
        } else if (req.params.hasOwnProperty("retiredPlayersUnnotable")) {
            const toDelete = [];

            await tx.players.index('tid').iterate(g.PLAYER.RETIRED, p => {
                if (p.awards.length === 0 && p.statsTids.indexOf(g.userTid) < 0) {
                    toDelete.push(p.pid);
                    return tx.players.delete(p.pid);
                }
            });
            await tx.playerStats.iterate(ps => {
                if (toDelete.indexOf(ps.pid) >= 0) {
                    return tx.playerStats.delete(ps.psid);
                }
            });
        }

        if (req.params.hasOwnProperty("playerStats")) {
            await tx.players.iterate(p => {
                p.ratings = [p.ratings[p.ratings.length - 1]];
                return p;
            });
            await tx.playerStats.iterate(ps => {
                if (ps.season < g.season) {
                    return tx.playerStats.delete(ps.psid);
                }
            });
        } else if (req.params.hasOwnProperty("playerStatsUnnotable")) {
            const toDelete = [];

            tx.players.iterate(p => {
                if (p.awards.length === 0 && p.statsTids.indexOf(g.userTid) < 0) {
                    p.ratings = [p.ratings[p.ratings.length - 1]];
                    toDelete.push(p.pid);
                }
                return p;
            });
            await tx.playerStats.iterate(ps => {
                if (ps.season < g.season && toDelete.indexOf(ps.pid) >= 0) {
                    return tx.playerStats.delete(ps.psid);
                }
            });
        }
    });

    league.updateLastDbChange();
    deleteOldDataEl.disabled = false;
    deleteOldDataSuccessEl.style.visibility = "visible";
}

function uiFirst() {
    ui.title("Delete Old Data");
}

module.exports = bbgmView.init({
    id: "deleteOldData",
    get,
    post,
    uiFirst
});
