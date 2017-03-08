// @flow

import {g} from '../../common';
import {idb} from '../db';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateTeams(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    if ((inputs.season === g.season && (updateEvents.includes('gameSim') || updateEvents.includes('playerMovement'))) || inputs.season !== state.season) {
        const teams = await idb.getCopies.teams({
            attrs: ["abbrev", "tid"],
            seasonAttrs: ["won", "lost"],
            stats: ["gp", "fgAtRim", "fgaAtRim", "fgpAtRim", "fgLowPost", "fgaLowPost", "fgpLowPost", "fgMidRange", "fgaMidRange", "fgpMidRange", "tp", "tpa", "tpp"],
            season: inputs.season,
        });

        return {
            season: inputs.season,
            teams,
        };
    }
}

export default {
    runBefore: [updateTeams],
};
