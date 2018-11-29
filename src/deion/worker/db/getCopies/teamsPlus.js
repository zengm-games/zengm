// @flow;

import { overrides } from "../../util";
import type { TeamFiltered, TeamsPlusOptions } from "../../../common/types";

const teamsPlus = (options: TeamsPlusOptions): Promise<TeamFiltered[]> => {
    if (!overrides.db.getCopies.teamsPlus) {
        throw new Error("Missing overrides.db.getCopies.teamsPlus");
    }
    return overrides.db.getCopies.teamsPlus(options);
};

export default teamsPlus;
