/**
 * @name util.ads
 * @namespace Everyone loves advertisements, right?
 */
/*eslint new-cap: 0*/
define(["globals", "lib/jquery"], function (g, $) {
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

        // If Survata is down, try other ad
        /*eslint no-use-before-define: 0*/
        window.Survata.fail(show);
    }

    function showModal() {
        $("#modal-ads").modal("show");
    }

/*    function showInsticator() {
        $("#modal-insticator").modal("show");
        //eslint camelcase: 0//
        window.instciator_WidgetSettingUUID = '2d2cebf4-d347-43c9-a5af-8a9ee4f251f4';
        (function () {
            var iscript = document.createElement('script');
            iscript.type = 'text/javascript';
            iscript.async = true;
            iscript.src = 'https://' + 'insticator.com' + '/public/versions/desktop/js/insticator-api-embed2.js';
            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(iscript);
        }());
    }*/

    function show() {
        var adTimer, currentTimestamp, now, r;

        // No ads during multi season auto sim
        if (g.autoPlaySeasons > 0) {
            return;
        }

        // No ads for Gold members
        currentTimestamp = Math.floor(Date.now() / 1000);
        if (!g.vm.topMenu.goldCancelled() && currentTimestamp <= g.vm.topMenu.goldUntil()) {
            return;
        }

        r = Math.random();
        if (r < 0.68) {
            showGCS();
        } else if (r < 0.75) {
            showModal();
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
        show: show,
        showModal: showModal
    };
});