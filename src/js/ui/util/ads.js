// @flow

import { emitter } from "../util";

function showGcs() {
    window.TriggerPrompt("http://www.basketball-gm.com/", new Date().getTime());
}

function showSurvata() {
    window.Survata.ready(() => {
        const s = window.Survata.createSurveywall({
            brand: "Basketball GM",
            explainer:
                "Please take this short survey to support Basketball GM!",
            disallowClose: true,
            allowSkip: false,
            contentName: new Date().toISOString(),
        });

        s.on("load", data => {
            if (data.status === "monetizable") {
                s.startInterview();
            } else {
                // If Survata doesn't have a survey to show, try GCS
                showGcs();
            }
        });
    });

    // If Survata is down, try other ad
    // eslint-disable-next-line no-use-before-define
    window.Survata.fail(() => {
        // Pass autoPlaySeasons as 0 because this code would never be reached otherwise (showAd would early exit)
        emitter.emit("showAd", "modal", 0);
    });
}

function showModal() {
    emitter.emit("updateState", { showNagModal: true });
}

export default {
    showModal,
    showSurvata,
    showGcs,
};
