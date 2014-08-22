/**
 * @name util.ads
 * @namespace Everyone loves advertisements, right?
 */
define(["lib/jquery", "util/helpers"], function ($, helpers) {
    "use strict";

    function showGCS() {
        helpers.bbgmPing("tryGCS");
        TriggerPrompt("http://www.basketball-gm.com/", (new Date()).getTime());
    }

    function showSurvata() {
        var now, adTimer;

        helpers.bbgmPing("trySurvata");

        // This is all in milliseconds!
        adTimer = localStorage.adTimer !== undefined ? parseInt(localStorage.adTimer, 10) : 0;
        now = Date.now();

        // Only show ad once per 60 minutes, at most
        if (now - adTimer > 1000 * 60 * 60) {
            Survata.ready(function () {
                var s = Survata.createSurveywall({
                    brand: "Basketball GM",
                    explainer: "Please take this short survey to support Basketball GM!",
                    disallowClose: true,
                    allowSkip: false
                });

                s.on("load", function (data) {
                    if (data.status === "monetizable") {
                        s.startInterview();

                        helpers.bbgmPing("showSurvata");
                        localStorage.adTimer = now;
                    }/* else {
                        // If Survata doesn't have a survey to show, try GCS
                        showGCS();
                    }*/
                });
            });

            /*Survata.fail(function() {
                // If Survata is down, try GCS
                showGCS();
            });*/
        }
    }

    function showModal() {
        $("#modal-ads").modal("show");
    }

    // Show GCS first, which will fall back to Survata (see callbackGCS in index.html)
    function show() {
        showGCS();
    }

    return {
        show: show,
        showSurvata: showSurvata
    };
});