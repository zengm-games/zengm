// @flow

import g from '../../globals';
import {getCopy} from '../db';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import TeamShotLocations from '../../ui/views/TeamShotLocations';

function get(ctx) {
    return {
        season: helpers.validateSeason(ctx.params.season),
    };
}

async function updateTeams(inputs, updateEvents, state) {
    if (updateEvents.includes('dbChange') || (inputs.season === g.season && (updateEvents.includes('gameSim') || updateEvents.includes('playerMovement'))) || inputs.season !== state.season) {
        const teams = await getCopy.teams({
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

export default bbgmViewReact.init({
    id: "teamShotLocations",
    get,
    runBefore: [updateTeams],
    Component: TeamShotLocations,
});
