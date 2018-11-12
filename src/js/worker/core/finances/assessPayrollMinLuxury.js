// @flow

import { team } from "..";
import { idb } from "../../db";
import { g } from "../../util";

/**
 * Assess the payroll and apply minimum and luxury taxes.
 * Distribute half of the collected luxury taxes to teams under the salary cap.
 *
 * @memberOf core.finances
 * @return {Promise}
 */
const assessPayrollMinLuxury = async () => {
    let collectedTax = 0;

    const payrolls = await team.getPayrolls();

    const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
        "teamSeasonsBySeasonTid",
        [[g.season], [g.season, "Z"]],
    );
    for (const teamSeason of teamSeasons) {
        // Store payroll
        teamSeason.payrollEndOfSeason = payrolls[teamSeason.tid];

        // Assess minimum payroll tax and luxury tax
        if (payrolls[teamSeason.tid] < g.minPayroll) {
            teamSeason.expenses.minTax.amount =
                g.minPayroll - payrolls[teamSeason.tid];
            teamSeason.cash -= teamSeason.expenses.minTax.amount;
        } else if (payrolls[teamSeason.tid] > g.luxuryPayroll && !g.hardCap) {
            // Only apply luxury tax if hard cap is disabled!
            const amount =
                g.luxuryTax * (payrolls[teamSeason.tid] - g.luxuryPayroll);
            collectedTax += amount;
            teamSeason.expenses.luxuryTax.amount = amount;
            teamSeason.cash -= teamSeason.expenses.luxuryTax.amount;
        }
    }

    const defaultRank = (g.numTeams + 1) / 2;

    const payteams = payrolls.filter(x => x <= g.salaryCap);
    if (payteams.length > 0 && collectedTax > 0) {
        const distribute = (collectedTax * 0.5) / payteams.length;
        for (const teamSeason of teamSeasons) {
            if (payrolls[teamSeason.tid] <= g.salaryCap) {
                teamSeason.revenues.luxuryTaxShare = {
                    amount: distribute,
                    rank: defaultRank,
                };
                teamSeason.cash += distribute;
            } else {
                teamSeason.revenues.luxuryTaxShare = {
                    amount: 0,
                    rank: defaultRank,
                };
            }
        }
    }

    for (const teamSeason of teamSeasons) {
        await idb.cache.teamSeasons.put(teamSeason);
    }
};

export default assessPayrollMinLuxury;
