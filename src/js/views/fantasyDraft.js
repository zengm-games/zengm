const g = require('../globals');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const FantasyDraft = require('./views/FantasyDraft');

function get() {
    if (g.phase === g.PHASE.DRAFT) {
        return {
            errorMessage: "You can't start a fantasy draft while a regular draft is already in progress.",
        };
    }
    if (g.phase === g.PHASE.FANTASY_DRAFT) {
        return {
            redirectUrl: helpers.leagueUrl(["draft"]),
        };
    }
}

module.exports = bbgmViewReact.init({
    id: "fantasyDraft",
    get,
    Component: FantasyDraft,
});
