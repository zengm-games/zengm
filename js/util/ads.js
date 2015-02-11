/**
 * @name util.ads
 * @namespace Everyone loves advertisements, right?
 */
/*eslint new-cap: 0*/
define(["globals"], function (g) {
    "use strict";

    function showGCS() {
        window.TriggerPrompt("http://www.basketball-gm.com/", (new Date()).getTime());
    }

    function showSurvata() {
        window.Survata.ready(function () {
            var s = window.Survata.createSurveywall({
                brand: "Basketball GM",
                explainer: "Please take this short survey to support Basketball GM!",
                disallowClose: true,
                allowSkip: false
            });

            s.on("load", function (data) {
                if (data.status === "monetizable") {
                    s.startInterview();
                } else {
                    // If Survata doesn't have a survey to show, try GCS
                    showGCS();
                }
            });
        });

        // If Survata is down, try GCS
        window.Survata.fail(showGCS);
    }

/*    function showModal() {
        $("#modal-ads").modal("show");
    }*/

    function show() {
        var adTimer, now;

        // No ads during multi season auto sim
        if (g.autoPlaySeasons > 0) {
            return;
        }

        if (Math.random() < 0.75) {
            showGCS();
        } else {
            // This is all in milliseconds!
            adTimer = localStorage.adTimer !== undefined ? parseInt(localStorage.adTimer, 10) : 0;
            now = Date.now();

            // Only show ad once per 60 minutes, at most
            if (now - adTimer > 1000 * 60 * 60) {
                showSurvata();
                localStorage.adTimer = now;
            }
        }
    }

    return {
        show: show
    };
});