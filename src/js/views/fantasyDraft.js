const g = require('../globals');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const FantasyDraft = require('./views/FantasyDraft');

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

module.exports = bbgmViewReact.init({
    id: "fantasyDraft",
    get,
    runBefore: [updateFantasyDraft],
    Component: FantasyDraft,
});
