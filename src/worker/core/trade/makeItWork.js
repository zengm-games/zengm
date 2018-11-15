// @flow

import { team } from "..";
import { idb } from "../../db";
import type { TradePickValues, TradeTeams } from "../../../common/types";
import isUntradable from "./isUntradable";

/**
 * Make a trade work
 *
 * Have the AI add players/picks until they like the deal. Uses forward selection to try to find the first deal the AI likes.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
 * @param {boolean} holdUserConstant If true, then players/picks will only be added from the other team. This is useful for the trading block feature.
 * @param {?Object} estValuesCached Estimated draft pick values from trade.getPickValues, or null. Only pass if you're going to call this repeatedly, then it'll be faster if you cache the values up front.
 * @return {Promise.<?Object>} If it works, resolves to a teams object (similar to first input) with the "made it work" trade info. Otherwise, resolves to undefined
 */
const makeItWork = async (
    teams: TradeTeams,
    holdUserConstant: boolean,
    estValuesCached?: TradePickValues,
): Promise<TradeTeams | void> => {
    let initialSign;
    let added = 0;

    // Add either the highest value asset or the lowest value one that makes the trade good for the AI team.
    const tryAddAsset = async () => {
        const assets = [];

        if (!holdUserConstant) {
            // Get all players not in userPids
            const players = await idb.getCopies.players({ tid: teams[0].tid });
            for (const p of players) {
                if (
                    !teams[0].pids.includes(p.pid) &&
                    !teams[0].pidsExcluded.includes(p.pid) &&
                    !isUntradable(p).untradable
                ) {
                    assets.push({
                        type: "player",
                        dv: 0,
                        pid: p.pid,
                        tid: teams[0].tid,
                    });
                }
            }
        }

        // Get all players not in otherPids
        const players = await idb.getCopies.players({ tid: teams[1].tid });
        for (const p of players) {
            if (
                !teams[1].pids.includes(p.pid) &&
                !teams[1].pidsExcluded.includes(p.pid) &&
                !isUntradable(p).untradable
            ) {
                assets.push({
                    type: "player",
                    dv: 0,
                    pid: p.pid,
                    tid: teams[1].tid,
                });
            }
        }

        if (!holdUserConstant) {
            // Get all draft picks not in userDpids
            const draftPicks = await idb.cache.draftPicks.indexGetAll(
                "draftPicksByTid",
                teams[0].tid,
            );
            for (const dp of draftPicks) {
                if (
                    !teams[0].dpids.includes(dp.dpid) &&
                    !teams[0].dpidsExcluded.includes(dp.dpid)
                ) {
                    assets.push({
                        type: "draftPick",
                        dv: 0,
                        dpid: dp.dpid,
                        tid: teams[0].tid,
                    });
                }
            }
        }

        // Get all draft picks not in otherDpids
        const draftPicks = await idb.cache.draftPicks.indexGetAll(
            "draftPicksByTid",
            teams[1].tid,
        );
        for (const dp of draftPicks) {
            if (
                !teams[1].dpids.includes(dp.dpid) &&
                !teams[1].dpidsExcluded.includes(dp.dpid)
            ) {
                assets.push({
                    type: "draftPick",
                    dv: 0,
                    dpid: dp.dpid,
                    tid: teams[1].tid,
                });
            }
        }

        // If we've already added 5 assets or there are no more to try, stop
        if (initialSign === -1 && (assets.length === 0 || added >= 5)) {
            return;
        }

        // Calculate the value for each asset added to the trade, for use in forward selection
        await Promise.all(
            assets.map(async asset => {
                const userPids = teams[0].pids.slice();
                const otherPids = teams[1].pids.slice();
                const userDpids = teams[0].dpids.slice();
                const otherDpids = teams[1].dpids.slice();

                if (asset.type === "player") {
                    if (asset.tid === teams[0].tid) {
                        userPids.push(asset.pid);
                    } else {
                        otherPids.push(asset.pid);
                    }
                } else if (asset.tid === teams[0].tid) {
                    userDpids.push(asset.dpid);
                } else {
                    otherDpids.push(asset.dpid);
                }

                asset.dv = await team.valueChange(
                    teams[1].tid,
                    userPids,
                    otherPids,
                    userDpids,
                    otherDpids,
                    estValuesCached,
                );
            }),
        );

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
            if (asset.tid === teams[0].tid) {
                teams[0].pids.push(asset.pid);
            } else {
                teams[1].pids.push(asset.pid);
            }
        } else if (asset.tid === teams[0].tid) {
            teams[0].dpids.push(asset.dpid);
        } else {
            teams[1].dpids.push(asset.dpid);
        }

        added += 1;

        // eslint-disable-next-line no-use-before-define
        return testTrade();
    };

    // See if the AI team likes the current trade. If not, try adding something to it.
    async function testTrade() {
        const dv = await team.valueChange(
            teams[1].tid,
            teams[0].pids,
            teams[1].pids,
            teams[0].dpids,
            teams[1].dpids,
            estValuesCached,
        );

        if (dv > 0 && initialSign === -1) {
            return teams;
        }

        if (
            (added > 2 || (added > 0 && Math.random() > 0.5)) &&
            initialSign === 1
        ) {
            if (dv > 0) {
                return teams;
            }

            return;
        }

        return tryAddAsset();
    }

    const dv = await team.valueChange(
        teams[1].tid,
        teams[0].pids,
        teams[1].pids,
        teams[0].dpids,
        teams[1].dpids,
        estValuesCached,
    );
    if (dv > 0) {
        // Try to make trade better for user's team
        initialSign = 1;
    } else {
        // Try to make trade better for AI team
        initialSign = -1;
    }

    return testTrade();
};

export default makeItWork;
