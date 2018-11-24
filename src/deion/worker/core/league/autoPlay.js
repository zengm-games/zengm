// @flow

import { PHASE } from "../../../common";
import { draft, freeAgents, game, phase, season } from "..";
import { g } from "../../util";
import type { Conditions } from "../../../common/types";

// Depending on phase, initiate action that will lead to the next phase
const autoPlay = async (conditions: Conditions) => {
    if (g.phase === PHASE.PRESEASON) {
        await phase.newPhase(PHASE.REGULAR_SEASON, conditions);
    } else if (g.phase === PHASE.REGULAR_SEASON) {
        const numDays = await season.getDaysLeftSchedule();
        await game.play(numDays, conditions);
    } else if (g.phase === PHASE.PLAYOFFS) {
        await game.play(100, conditions);
    } else if (g.phase === PHASE.DRAFT_LOTTERY) {
        await phase.newPhase(PHASE.DRAFT, conditions);
    } else if (g.phase === PHASE.DRAFT) {
        await draft.runPicks(false, conditions);
    } else if (g.phase === PHASE.AFTER_DRAFT) {
        await phase.newPhase(PHASE.RESIGN_PLAYERS, conditions);
    } else if (g.phase === PHASE.RESIGN_PLAYERS) {
        await phase.newPhase(PHASE.FREE_AGENCY, conditions);
    } else if (g.phase === PHASE.FREE_AGENCY) {
        await freeAgents.play(g.daysLeft, conditions);
    } else {
        throw new Error(`Unknown phase: ${g.phase}`);
    }
};

export default autoPlay;
