// @flow

import { contractNegotiation } from "..";
import { helpers } from "../../util";

const newPhaseFreeAgency = async () => {
    // Delete all current negotiations to resign players
    await contractNegotiation.cancelAll();

    return [helpers.leagueUrl(["free_agents"]), ["playerMovement"]];
};

export default newPhaseFreeAgency;
