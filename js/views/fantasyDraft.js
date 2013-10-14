/**
 * @name views.fantasyDraft
 * @namespace Fantasy draft confirmation.
 */
define(["globals", "ui", "core/season", "util/bbgmView"], function (g, ui, season, bbgmView) {
    "use strict";

    function get(req) {

    }

    function post(req) {
console.log(req);
        document.getElementById("start-fantasy-draft").disabled = true;

        season.newPhase(g.PHASE.FANTASY_DRAFT);
    }

    function uiFirst() {
        ui.title("Fantasy Draft");
    }

    return bbgmView.init({
        id: "fantasyDraft",
        get: get,
        post: post,
        uiFirst: uiFirst
    });
});