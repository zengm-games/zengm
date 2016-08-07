const g = require('../globals');
const league = require('./league');
const player = require('./player');
const team = require('./team');
const Promise = require('bluebird');
const eventLog = require('../util/eventLog');
const helpers = require('../util/helpers');

/**
 * Get the contents of the current trade from the database.
 *
 * @memberOf core.trade
 * @param {Promise.<Array.<Object>>} Resolves to an array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
 */
async function get(ot) {
    const dbOrTx = ot || g.dbl;
    const tr = await dbOrTx.trade.get(0);
    return tr.teams;
}

/**
 * Start a new trade with a team.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs). If the other team's tid is null, it will automatically be determined from the pids.
 * @return {Promise}
 */
async function create(teams) {
    const oldTeams = await get();

    // If nothing is in this trade, it's just a team switch, so keep the old stuff from the user's team
    if (teams[0].pids.length === 0 && teams[1].pids.length === 0 && teams[0].dpids.length === 0 && teams[1].dpids.length === 0) {
        teams[0].pids = oldTeams[0].pids;
        teams[0].dpids = oldTeams[0].dpids;
    }

    // Make sure tid is set
    if (teams[1].tid === undefined || teams[1].tid === null) {
        const p = await g.dbl.players.get(teams[1].pids[0]);
        teams[1].tid = p.tid;
    }

    await g.dbl.tx("trade", "readwrite", tx => {
        return tx.trade.put({
            rid: 0,
            teams,
        });
    });

    league.updateLastDbChange();
}

/**
 * Gets the team ID for the team that the user is trading with.
 *
 * @memberOf core.trade
 * @return {er} Resolves to the other team's team ID.
 */
async function getOtherTid() {
    const teams = await get();
    return teams[1].tid;
}

/**
 * Filter untradable players.
 *
 * If a player is not tradable, set untradable flag in the root of the object.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} players Array of player objects or partial player objects
 * @return {Array.<Object>} Processed input
 */
function filterUntradable(players) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].contract.exp <= g.season && g.phase > g.PHASE.PLAYOFFS && g.phase < g.PHASE.FREE_AGENCY) {
            // If the season is over, can't trade players whose contracts are expired
            players[i].untradable = true;
            players[i].untradableMsg = "Cannot trade expired contracts";
        } else if (players[i].gamesUntilTradable > 0) {
            // Can't trade players who recently were signed or traded
            players[i].untradable = true;
            players[i].untradableMsg = `Cannot trade recently-acquired player for ${players[i].gamesUntilTradable} more games`;
        } else {
            players[i].untradable = false;
            players[i].untradableMsg = "";
        }
    }

    return players;
}

/**
 * Is a player untradable.
 *
 * Just calls filterUntradable and discards everything but the boolean.
 *
 * @memberOf core.trade
 * @param {<Object>} players Player object or partial player objects
 * @return {boolean} Processed input
 */
function isUntradable(player) {
    return filterUntradable([player])[0].untradable;
}

/**
 * Validates that players are allowed to be traded and updates the database.
 *
 * If any of the player IDs submitted do not correspond with the two teams that are trading, they will be ignored.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
 * @return {Promise.<Array.<Object>>} Resolves to an array taht's the same as the input, but with invalid entries removed.
 */
async function updatePlayers(teams) {
    // This is just for debugging
    team.valueChange(teams[1].tid, teams[0].pids, teams[1].pids, teams[0].dpids, teams[1].dpids, null).then(dv => {
        console.log(dv);
    });

    await g.dbl.tx(["draftPicks", "players"], async tx => {
        // Make sure each entry in teams has pids and dpids that actually correspond to the correct tid
        const promises = [];
        teams.forEach(t => {
            // Check players
            promises.push(tx.players.index('tid').getAll(t.tid).then(players => {
                const pidsGood = [];
                for (let j = 0; j < players.length; j++) {
                    // Also, make sure player is not untradable
                    if (t.pids.indexOf(players[j].pid) >= 0 && !isUntradable(players[j])) {
                        pidsGood.push(players[j].pid);
                    }
                }
                t.pids = pidsGood;
            }));

            // Check draft picks
            promises.push(tx.draftPicks.index('tid').getAll(t.tid).then(dps => {
                const dpidsGood = [];
                for (let j = 0; j < dps.length; j++) {
                    if (t.dpids.indexOf(dps[j].dpid) >= 0) {
                        dpidsGood.push(dps[j].dpid);
                    }
                }
                t.dpids = dpidsGood;
            }));
        });

        await Promise.all(promises);
    });

    let updated = false; // Has the trade actually changed?

    await g.dbl.tx("trade", "readwrite", async tx => {
        const oldTeams = await get(tx);
        for (let i = 0; i < 2; i++) {
            if (teams[i].tid !== oldTeams[i].tid) {
                updated = true;
                break;
            }
            if (teams[i].pids.toString() !== oldTeams[i].pids.toString()) {
                updated = true;
                break;
            }
            if (teams[i].dpids.toString() !== oldTeams[i].dpids.toString()) {
                updated = true;
                break;
            }
        }

        if (updated) {
            await tx.trade.put({
                rid: 0,
                teams,
            });
        }
    });

    if (updated) {
        league.updateLastDbChange();
    }

    return teams;
}


/**
 * Create a summary of the trade, for eventual display to the user.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
 * @return {Promise.Object} Resolves to an object contianing the trade summary.
 */
function summary(teams) {
    const tids = [teams[0].tid, teams[1].tid];
    const pids = [teams[0].pids, teams[1].pids];
    const dpids = [teams[0].dpids, teams[1].dpids];

    const s = {teams: [], warning: null};
    for (let i = 0; i < 2; i++) {
        s.teams.push({trade: [], total: 0, payrollAfterTrade: 0, name: ""});
    }

    return g.dbl.tx(["draftPicks", "players", "releasedPlayers"], async tx => {
        // Calculate properties of the trade
        const players = [[], []];
        const promises = [];
        [0, 1].forEach(i => {
            promises.push(tx.players.index('tid').getAll(tids[i]).then(playersTemp => {
                players[i] = player.filter(playersTemp, {
                    attrs: ["pid", "name", "contract"],
                    season: g.season,
                    tid: tids[i],
                    showRookies: true,
                });
                s.teams[i].trade = players[i].filter(player => pids[i].indexOf(player.pid) >= 0);
                s.teams[i].total = s.teams[i].trade.reduce((memo, player) => memo + player.contract.amount, 0);
            }));

            promises.push(tx.draftPicks.index('tid').getAll(tids[i]).then(picks => {
                s.teams[i].picks = [];
                for (let j = 0; j < picks.length; j++) {
                    if (dpids[i].indexOf(picks[j].dpid) >= 0) {
                        s.teams[i].picks.push({
                            dpid: picks[j].dpid,
                            desc: `${picks[j].season} ${picks[j].round === 1 ? "1st" : "2nd"} round pick (${g.teamAbbrevsCache[picks[j].originalTid]})`,
                        });
                    }
                }
            }));
        });

        await Promise.all(promises);

        // Test if any warnings need to be displayed
        const overCap = [false, false];
        const ratios = [0, 0];
        await Promise.map([0, 1], async j => {
            const k = j === 0 ? 1 : 0;

            s.teams[j].name = `${g.teamRegionsCache[tids[j]]} ${g.teamNamesCache[tids[j]]}`;

            if (s.teams[j].total > 0) {
                ratios[j] = Math.floor((100 * s.teams[k].total) / s.teams[j].total);
            } else if (s.teams[k].total > 0) {
                ratios[j] = Infinity;
            } else {
                ratios[j] = 100;
            }

            const payroll = await team.getPayroll(tx, tids[j]).get(0);
            s.teams[j].payrollAfterTrade = payroll / 1000 + s.teams[k].total - s.teams[j].total;
            if (s.teams[j].payrollAfterTrade > g.salaryCap / 1000) {
                overCap[j] = true;
            }
        });

        if ((ratios[0] > 125 && overCap[0] === true) || (ratios[1] > 125 && overCap[1] === true)) {
            // Which team is at fault?;
            const j = ratios[0] > 125 ? 0 : 1;
            s.warning = `The ${s.teams[j].name} are over the salary cap, so the players it receives must have a combined salary of less than 125% of the salaries of the players it trades away.  Currently, that value is ${ratios[j]}%.`;
        }

        return s;
    });
}


/**
 * Remove all players currently added to the trade.
 *
 * @memberOf core.trade
 * @return {Promise}
 */
async function clear() {
    await g.dbl.tx("trade", "readwrite", async tx => {
        const tr = await tx.trade.get(0);

        for (let i = 0; i < tr.teams.length; i++) {
            tr.teams[i].pids = [];
            tr.teams[i].dpids = [];
        }

        return tx.trade.put(tr);
    });

    league.updateLastDbChange();
}

/**
 * Proposes the current trade in the database.
 *
 * Before proposing the trade, the trade is validated to ensure that all player IDs match up with team IDs.
 *
 * @memberOf core.trade
 * @param {boolean} forceTrade When true (like in God Mode), this trade is accepted regardless of the AI
 * @return {Promise.<boolean, string>} Resolves to an array. The first argument is a boolean for whether the trade was accepted or not. The second argument is a string containing a message to be dispalyed to the user.
 */
async function propose(forceTrade) {
    forceTrade = forceTrade !== undefined ? forceTrade : false;

    if (g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.PLAYOFFS) {
        return [false, "Error! You're not allowed to make trades now."];
    }

    const teams = await get();

    const tids = [teams[0].tid, teams[1].tid];
    const pids = [teams[0].pids, teams[1].pids];
    const dpids = [teams[0].dpids, teams[1].dpids];

    // The summary will return a warning if (there is a problem. In that case,
    // that warning will already be pushed to the user so there is no need to
    // return a redundant message here.
    const s = await summary(teams);

    if (s.warning && !forceTrade) {
        return [false, null];
    }

    let outcome = "rejected"; // Default

    const dv = await team.valueChange(teams[1].tid, teams[0].pids, teams[1].pids, teams[0].dpids, teams[1].dpids, null);

    await g.dbl.tx(["draftPicks", "players", "playerStats"], "readwrite", tx => {
        if (dv > 0 || forceTrade) {
            // Trade players
            outcome = "accepted";
            [0, 1].forEach(j => {
                const k = j === 0 ? 1 : 0;

                Promise.map(pids[j], async pid => {
                    let p = await tx.players.get(pid);
                    p.tid = tids[k];
                    // Don't make traded players untradable
                    //p.gamesUntilTradable = 15;
                    p.ptModifier = 1; // Reset
                    if (g.phase <= g.PHASE.PLAYOFFS) {
                        p = player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS);
                    }
                    await tx.players.put(p);
                });

                Promise.map(dpids[j], async dpid => {
                    const dp = await tx.draftPicks.get(dpid);
                    dp.tid = tids[k];
                    dp.abbrev = g.teamAbbrevsCache[tids[k]];
                    await tx.draftPicks.put(dp);
                });
            });

            // Log event
            const formatAssetsEventLog = t => {
                const strings = [];

                t.trade.forEach(p => strings.push(`<a href="${helpers.leagueUrl(["player", p.pid])}">${p.name}</a>`));
                t.picks.forEach(dp => strings.push(`a ${dp.desc}`));

                let text;
                if (strings.length === 0) {
                    text = "nothing";
                } else if (strings.length === 1) {
                    text = strings[0];
                } else if (strings.length === 2) {
                    text = `${strings[0]} and ${strings[1]}`;
                } else {
                    text = strings[0];
                    for (let i = 1; i < strings.length; i++) {
                        if (i === strings.length - 1) {
                            text += `, and ${strings[i]}`;
                        } else {
                            text += `, ${strings[i]}`;
                        }
                    }
                }

                return text;
            };

            eventLog.add(null, {
                type: "trade",
                text: `The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[tids[0]], g.season])}">${g.teamNamesCache[tids[0]]}</a> traded ${formatAssetsEventLog(s.teams[0])} to the <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[tids[1]], g.season])}">${g.teamNamesCache[tids[1]]}</a> for ${formatAssetsEventLog(s.teams[1])}.`,
                showNotification: false,
                pids: pids[0].concat(pids[1]),
                tids,
            });
        }
    });

    if (outcome === "accepted") {
        await clear(); // This includes dbChange

        // Auto-sort CPU team roster
        if (g.userTids.indexOf(tids[1]) < 0) {
            await g.dbl.tx("players", "readwrite", tx => team.rosterAutoSort(tx, tids[1]));
        }

        return [true, 'Trade accepted! "Nice doing business with you!"'];
    }

    return [false, 'Trade rejected! "What, are you crazy?"'];
}

/**
 * Make a trade work
 *
 * Have the AI add players/picks until they like the deal. Uses forward selection to try to find the first deal the AI likes.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
 * @param {boolean} holdUserConstant If true, then players/picks will only be added from the other team. This is useful for the trading block feature.
 * @param {?Object} estValuesCached Estimated draft pick values from trade.getPickValues, or null. Only pass if you're going to call this repeatedly, then it'll be faster if you cache the values up front.
 * @return {Promise.[boolean, Object]} Resolves to an array with one or two elements. First is a boolean indicating whether "make it work" was successful. If true, then the second argument is set to a teams object (similar to first input) with the "made it work" trade info.
 */
async function makeItWork(teams, holdUserConstant, estValuesCached) {
    let initialSign;
    let added = 0;

    // Add either the highest value asset or the lowest value one that makes the trade good for the AI team.
    const tryAddAsset = async () => {
        const assets = [];

        await g.dbl.tx(["draftPicks", "players"], tx => {
            if (!holdUserConstant) {
                // Get all players not in userPids
                tx.players.index('tid').iterate(teams[0].tid, p => {
                    if (teams[0].pids.indexOf(p.pid) < 0 && !isUntradable(p)) {
                        assets.push({
                            type: "player",
                            pid: p.pid,
                            tid: teams[0].tid,
                        });
                    }
                });
            }

            // Get all players not in otherPids
            tx.players.index('tid').iterate(teams[1].tid, p => {
                if (teams[1].pids.indexOf(p.pid) < 0 && !isUntradable(p)) {
                    assets.push({
                        type: "player",
                        pid: p.pid,
                        tid: teams[1].tid,
                    });
                }
            });

            if (!holdUserConstant) {
                // Get all draft picks not in userDpids
                tx.draftPicks.index('tid').iterate(teams[0].tid, dp => {
                    if (teams[0].dpids.indexOf(dp.dpid) < 0) {
                        assets.push({
                            type: "draftPick",
                            dpid: dp.dpid,
                            tid: teams[0].tid,
                        });
                    }
                });
            }

            // Get all draft picks not in otherDpids
            tx.draftPicks.index('tid').iterate(teams[1].tid, dp => {
                if (teams[1].dpids.indexOf(dp.dpid) < 0) {
                    assets.push({
                        type: "draftPick",
                        dpid: dp.dpid,
                        tid: teams[1].tid,
                    });
                }
            });
        });

        // If we've already added 5 assets or there are no more to try, stop
        if (initialSign === -1 && (assets.length === 0 || added >= 5)) {
            return [false];
        }

        // Calculate the value for each asset added to the trade, for use in forward selection
        await Promise.map(assets, async asset => {
            const userPids = teams[0].pids.slice();
            const otherPids = teams[1].pids.slice();
            const userDpids = teams[0].dpids.slice();
            const otherDpids = teams[1].dpids.slice();

            if (asset.type === "player") {
                if (asset.tid === g.userTid) {
                    userPids.push(asset.pid);
                } else {
                    otherPids.push(asset.pid);
                }
            } else {
                if (asset.tid === g.userTid) {
                    userDpids.push(asset.dpid);
                } else {
                    otherDpids.push(asset.dpid);
                }
            }

            asset.dv = await team.valueChange(teams[1].tid, userPids, otherPids, userDpids, otherDpids, estValuesCached);
        });

        assets.sort((a, b) => b.dv - a.dv);

        // Find the asset that will push the trade value the smallest amount above 0
        let j;
        for (j = 0; j < assets.length; j++) {
            if (assets[j].dv < 0) {
                break;
            }
        }
        if (j > 0) {
            j -= 1;
        }
        const asset = assets[j];
        if (asset.type === "player") {
            if (asset.tid === g.userTid) {
                teams[0].pids.push(asset.pid);
            } else {
                teams[1].pids.push(asset.pid);
            }
        } else {
            if (asset.tid === g.userTid) {
                teams[0].dpids.push(asset.dpid);
            } else {
                teams[1].dpids.push(asset.dpid);
            }
        }

        added += 1;

        return testTrade();
    };

    // See if the AI team likes the current trade. If not, try adding something to it.
    async function testTrade() {
        const dv = await team.valueChange(teams[1].tid, teams[0].pids, teams[1].pids, teams[0].dpids, teams[1].dpids, estValuesCached);

        if (dv > 0 && initialSign === -1) {
            return [true, teams];
        }

        if ((added > 2 || (added > 0 && Math.random() > 0.5)) && initialSign === 1) {
            if (dv > 0) {
                return [true, teams];
            }

            return [false];
        }

        return tryAddAsset();
    }

    const dv = await team.valueChange(teams[1].tid, teams[0].pids, teams[1].pids, teams[0].dpids, teams[1].dpids, estValuesCached);
    if (dv > 0) {
        // Try to make trade better for user's team
        initialSign = 1;
    } else {
        // Try to make trade better for AI team
        initialSign = -1;
    }

    return testTrade();
}

/**
 * Estimate draft pick values, based on the generated draft prospects in the database.
 *
 * This was made for team.valueChange, so it could be called once and the results cached.
 *
 * @memberOf core.trade
 * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on players; if null is passed, then a new transaction will be used.
 * @return {Promise.Object} Resolves to estimated draft pick values.
 */
async function getPickValues(ot) {
    const dbOrTx = ot || g.dbl;

    const estValues = {
        default: [75, 73, 71, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 50, 50, 49, 49, 49, 48, 48, 48, 47, 47, 47, 46, 46, 46, 45, 45, 45, 44, 44, 44, 43, 43, 43, 42, 42, 42, 41, 41, 41, 40, 40, 39, 39, 38, 38, 37, 37], // This is basically arbitrary
    };

    // Look up to 4 season in the future, but depending on whether this is before or after the draft, the first or last will be empty/incomplete
    const promises = [];
    for (let i = g.season; i < g.season + 4; i++) {
        promises.push(dbOrTx.players.index('draft.year').getAll(i).then(players => {
            if (players.length > 0) {
                for (let i = 0; i < players.length; i++) {
                    players[i].value += 4; // +4 is to generally make picks more valued
                }
                players.sort((a, b) => b.value - a.value);
                estValues[players[0].draft.year] = players.map(p => p.value);
            }
        }));
    }

    await Promise.all(promises);

    return estValues;
}

/**
 * Make a trade work
 *
 * This should be called for a trade negotiation, as it will update the trade objectStore.
 *
 * @memberOf core.trade
 * @return {Promise.string} Resolves to a string containing a message to be dispalyed to the user, as if it came from the AI GM.
 */
async function makeItWorkTrade() {
    const [estValues, teams0] = await Promise.all([
        getPickValues(),
        get(),
    ]);

    const [found, teams] = await makeItWork(helpers.deepCopy(teams0), false, estValues);

    if (!found) {
        return `${g.teamRegionsCache[teams0[1].tid]} GM: "I can\'t afford to give up so much."`;
    }

    const s = await summary(teams);

    // Store AI's proposed trade in database, if it's different
    let updated = false;

    for (let i = 0; i < 2; i++) {
        if (teams[i].tid !== teams0[i].tid) {
            updated = true;
            break;
        }
        if (teams[i].pids.toString() !== teams0[i].pids.toString()) {
            updated = true;
            break;
        }
        if (teams[i].dpids.toString() !== teams0[i].dpids.toString()) {
            updated = true;
            break;
        }
    }

    if (updated) {
        await g.dbl.tx("trade", "readwrite", tx => tx.trade.put({
            rid: 0,
            teams,
        }));
    }

    if (s.warning) {
        return `${g.teamRegionsCache[teams[1].tid]} GM: "Something like this would work if you can figure out how to get it done without breaking the salary cap rules."`;
    }

    return `${g.teamRegionsCache[teams[1].tid]} GM: "How does this sound?"`;
}

module.exports = {
    get,
    create,
    updatePlayers,
    getOtherTid,
    summary,
    clear,
    propose,
    makeItWork,
    makeItWorkTrade,
    filterUntradable,
    getPickValues,
};
