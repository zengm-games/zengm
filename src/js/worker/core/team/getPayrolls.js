// @flow

import range from "lodash/range";
import { g } from "../../../common";
import getPayroll from "./getPayroll";

/**
 * Get the total current payroll for every team team.
 *
 * @memberOf core.team
 * @return {Promise} Resolves to an array of payrolls, ordered by team id.
 */
const getPayrolls = (): Promise<number[]> => {
    return Promise.all(range(g.numTeams).map(tid => getPayroll(tid)));
};

export default getPayrolls;
