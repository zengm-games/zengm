/**
 * @name util.ads
 * @namespace Everyone loves advertisements, right?
 */
define(["lib/jquery"], function ($) {
    "use strict";

    function showGCS() {
        TriggerPrompt("http://www.basketball-gm.com/", (new Date()).getTime());
    }

    function showSurvata() {
        Survata.ready(function () {
            var s = Survata.createSurveywall({
                brand: "Basketball GM",
                explainer: "Please take this short survey to continue playing",
                disallowClose: true,
                allowSkip: false
            });

            s.on("load", function (data) {
                if (data.status === "monetizable") {
                    s.startInterview();
                }
            });
        });
    }

    function showModal() {
        $("#modal-ads").modal("show");
    }

    function show() {
        var now, adTimer;

        // This is all in milliseconds!
        adTimer = localStorage.adTimer !== undefined ? parseInt(localStorage.adTimer, 10) : 0;
        now = Date.now();

        // Only show ad once per 60 minutes, at most
        if (now - adTimer > 1000 * 60 * 60) {
            showSurvata();
            localStorage.adTimer = now;
        }
    }

    return {
        show: show
    };
});