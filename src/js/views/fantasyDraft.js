import g from '../globals';
import bbgmViewReact from '../util/bbgmViewReact';
import helpers from '../util/helpers';
import FantasyDraft from './views/FantasyDraft';

function get() {
    if (g.phase === g.PHASE.FANTASY_DRAFT) {
        return {
            redirectUrl: helpers.leagueUrl(["draft"]),
        };
    }
}

function updateFantasyDraft() {
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
