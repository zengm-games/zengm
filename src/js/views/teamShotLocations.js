import g from '../globals';
import team from '../core/team';
import bbgmViewReact from '../util/bbgmViewReact';
import helpers from '../util/helpers';
import TeamShotLocations from './views/TeamShotLocations';

function get(req) {
    return {
        season: helpers.validateSeason(req.params.season),
    };
}

async function updateTeams(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== state.season) {
        const teams = await team.filter({
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
