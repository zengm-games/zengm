// @flow

import { team } from "..";
import { idb } from "../../db";
import { g, helpers } from "../../util";
import type { TradeSummary, TradeTeams } from "../../../common/types";

/**
 * Create a summary of the trade, for eventual display to the user.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
 * @return {Promise.Object} Resolves to an object contianing the trade summary.
 */
const summary = async (teams: TradeTeams): Promise<TradeSummary> => {
    const tids = [teams[0].tid, teams[1].tid];
    const pids = [teams[0].pids, teams[1].pids];
    const dpids = [teams[0].dpids, teams[1].dpids];

    const s: TradeSummary = {
        teams: [
            {
                name: "",
                payrollAfterTrade: 0,
                picks: [],
                total: 0,
                trade: [],
            },
            {
                name: "",
                payrollAfterTrade: 0,
                picks: [],
                total: 0,
                trade: [],
            },
        ],
        warning: null,
    };

    // Calculate properties of the trade
    const promises = [];
    [0, 1].forEach(i => {
        promises.push(
            idb.cache.players
                .indexGetAll("playersByTid", tids[i])
                .then(async playersTemp => {
                    let players = playersTemp.filter(p =>
                        pids[i].includes(p.pid),
                    );
                    players = await idb.getCopies.playersPlus(players, {
                        attrs: ["pid", "name", "contract"],
                        season: g.season,
                        tid: tids[i],
                        showRookies: true,
                        showNoStats: true,
                    });
                    s.teams[i].trade = players;
                    s.teams[i].total = s.teams[i].trade.reduce(
                        (memo, p) => memo + p.contract.amount,
                        0,
                    );
                }),
        );

        promises.push(
            idb.cache.draftPicks
                .indexGetAll("draftPicksByTid", tids[i])
                .then(picks => {
                    for (let j = 0; j < picks.length; j++) {
                        if (dpids[i].includes(picks[j].dpid)) {
                            s.teams[i].picks.push({
                                dpid: picks[j].dpid,
                                desc: `${picks[j].season} ${helpers.ordinal(
                                    picks[j].round,
                                )} round pick (${
                                    g.teamAbbrevsCache[picks[j].originalTid]
                                })`,
                            });
                        }
                    }
                }),
        );
    });

    await Promise.all(promises);

    // Test if any warnings need to be displayed
    const overCap = [false, false];
    const ratios = [0, 0];
    await Promise.all(
        [0, 1].map(async j => {
            const k = j === 0 ? 1 : 0;

            s.teams[j].name = `${g.teamRegionsCache[tids[j]]} ${
                g.teamNamesCache[tids[j]]
            }`;

            if (s.teams[j].total > 0) {
                ratios[j] = Math.floor(
                    (100 * s.teams[k].total) / s.teams[j].total,
                );
            } else if (s.teams[k].total > 0) {
                ratios[j] = Infinity;
            } else {
                ratios[j] = 100;
            }

            const payroll = await team.getPayroll(tids[j]);
            s.teams[j].payrollAfterTrade =
                payroll / 1000 + s.teams[k].total - s.teams[j].total;
            if (s.teams[j].payrollAfterTrade > g.salaryCap / 1000) {
                overCap[j] = true;
            }
        }),
    );

    // For a hard cap, no trade that puts a team over the cap should be allowed. However, since the hard cap here is
    // not really hard (minimum contracts can go over), it's too harsh to enforce that.

    const softCapCondition =
        (ratios[0] > 125 && overCap[0]) || (ratios[1] > 125 && overCap[1]);

    if (softCapCondition) {
        // Which team is at fault?;
        const j = ratios[0] > 125 ? 0 : 1;
        s.warning = `The ${
            s.teams[j].name
        } are over the salary cap, so the players it receives must have a combined salary of less than 125% of the salaries of the players it trades away.  Currently, that value is ${
            ratios[j]
        }%.`;
    }

    return s;
};

export default summary;
