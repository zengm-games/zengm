// @flow

import g from '../../globals';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import FantasyDraft from '../../ui/views/FantasyDraft';

function get() {
    if (g.phase === g.PHASE.FANTASY_DRAFT) {
        return {
            redirectUrl: helpers.leagueUrl(["draft"]),
        };
    }
}

async function updateFantasyDraft() {
    return {
        phase: g.phase,
    };
}

export default bbgmViewReact.init({
    id: "fantasyDraft",
    get,
    runBefore: [updateFantasyDraft],
    Component: FantasyDraft,
});
