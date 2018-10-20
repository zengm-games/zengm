// @flow

import { PHASE } from "../../../common";
import addStatsRow from "./addStatsRow";
import setContract from "./setContract";
import { g } from "../../util";
import type {
    Phase,
    Player,
    PlayerContract,
    PlayerWithoutPid,
} from "../../../common/types";

const sign = (
    p: Player | PlayerWithoutPid,
    tid: number,
    contract: PlayerContract,
    phase?: Phase = g.phase,
) => {
    p.tid = tid;
    p.gamesUntilTradable = 14;

    // Handle stats if the season is in progress
    if (phase <= PHASE.PLAYOFFS) {
        // Otherwise, not needed until next season
        addStatsRow(p, phase === PHASE.PLAYOFFS);
    }

    setContract(p, contract, true);
};

export default sign;
