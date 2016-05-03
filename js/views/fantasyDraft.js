var g = require('../globals');
var ui = require('../ui');
var phase = require('../core/phase');
var bbgmView = require('../util/bbgmView');
var helpers = require('../util/helpers');

function get() {
    if (g.phase === g.PHASE.DRAFT) {
        return {
            errorMessage: "You can't start a fantasy draft while a regular draft is already in progress."
        };
    }
    if (g.phase === g.PHASE.FANTASY_DRAFT) {
        return {
            redirectUrl: helpers.leagueUrl(["draft"])
        };
    }
}

function post(req) {
    var position;

    position = req.params.position === "Random" ? "random" : parseInt(req.params.position, 10);

    document.getElementById("start-fantasy-draft").disabled = true;

    phase.newPhase(g.PHASE.FANTASY_DRAFT, position);
}

function uiFirst() {
    ui.title("Fantasy Draft");
}

module.exports = bbgmView.init({
    id: "fantasyDraft",
    get: get,
    post: post,
    uiFirst: uiFirst
});
