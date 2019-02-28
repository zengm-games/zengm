// @flow

import { g, overrides } from "../../util";

/**
 * Create a new team object.
 *
 * @memberOf core.team
 * @param {Object} tm Team metadata object, likely from core.league.create.
 * @return {Object} Team object to insert in the database.
 */
const generate = (tm: any) => {
    let strategy;
    if (tm.hasOwnProperty("strategy")) {
        strategy = tm.strategy;
    } else {
        strategy = Math.random() > 0.5 ? "contending" : "rebuilding";
    }

    const t = {
        tid: tm.tid,
        cid: tm.cid,
        did: tm.did,
        region: tm.region,
        name: tm.name,
        abbrev: tm.abbrev,
        imgURL: tm.imgURL !== undefined ? tm.imgURL : "",
        budget: {
            ticketPrice: {
                amount: tm.hasOwnProperty("budget")
                    ? tm.budget.ticketPrice.amount
                    : parseFloat(
                          (
                              (g.salaryCap / 90000) * 37 +
                              (25 * (g.numTeams - tm.popRank)) /
                                  (g.numTeams - 1)
                          ).toFixed(2),
                      ),
                rank: tm.hasOwnProperty("budget")
                    ? tm.budget.ticketPrice.rank
                    : tm.popRank,
            },
            scouting: {
                amount: tm.hasOwnProperty("budget")
                    ? tm.budget.scouting.amount
                    : Math.round(
                          (g.salaryCap / 90000) * 1350 +
                              (900 * (g.numTeams - tm.popRank)) /
                                  (g.numTeams - 1),
                      ) * 10,
                rank: tm.hasOwnProperty("budget")
                    ? tm.budget.scouting.rank
                    : tm.popRank,
            },
            coaching: {
                amount: tm.hasOwnProperty("budget")
                    ? tm.budget.coaching.amount
                    : Math.round(
                          (g.salaryCap / 90000) * 1350 +
                              (900 * (g.numTeams - tm.popRank)) /
                                  (g.numTeams - 1),
                      ) * 10,
                rank: tm.hasOwnProperty("budget")
                    ? tm.budget.coaching.rank
                    : tm.popRank,
            },
            health: {
                amount: tm.hasOwnProperty("budget")
                    ? tm.budget.health.amount
                    : Math.round(
                          (g.salaryCap / 90000) * 1350 +
                              (900 * (g.numTeams - tm.popRank)) /
                                  (g.numTeams - 1),
                      ) * 10,
                rank: tm.hasOwnProperty("budget")
                    ? tm.budget.health.rank
                    : tm.popRank,
            },
            facilities: {
                amount: tm.hasOwnProperty("budget")
                    ? tm.budget.facilities.amount
                    : Math.round(
                          (g.salaryCap / 90000) * 1350 +
                              (900 * (g.numTeams - tm.popRank)) /
                                  (g.numTeams - 1),
                      ) * 10,
                rank: tm.hasOwnProperty("budget")
                    ? tm.budget.facilities.rank
                    : tm.popRank,
            },
        },
        strategy,
        depth: tm.depth,
    };

    if (process.env.SPORT === "football" && tm.depth === undefined) {
        t.depth = overrides.common.constants.POSITIONS.reduce((depth, pos) => {
            depth[pos] = [];
            return depth;
        }, {});
    }

    return t;
};

export default generate;
