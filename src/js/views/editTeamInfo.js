// @flow

import g from '../globals';
import {getCopy} from '../db';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import EditTeamInfo from './views/EditTeamInfo';

async function updateTeamInfo() {
    const teams = await getCopy.teams({
        attrs: ["tid", "abbrev", "region", "name", "imgURL"],
        seasonAttrs: ["pop"],
        season: g.season,
    });

    for (let i = 0; i < teams.length; i++) {
        teams[i].pop = helpers.round(teams[i].seasonAttrs.pop, 6);
    }

    return {
        godMode: g.godMode,
        teams,
    };
}

export default bbgmViewReact.init({
    id: "editTeamInfo",
    runBefore: [updateTeamInfo],
    Component: EditTeamInfo,
});
