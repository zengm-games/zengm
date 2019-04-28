// @flow

import emitter from "./emitter";

function showGcs() {
    if (process.env.SPORT === "basketball") {
        window.TriggerPrompt(
            "http://www.basketball-gm.com/",
            new Date().getTime(),
        );
    } else {
        console.log("Not sure what to do for non-basketball GCS");
    }
}

function showModal() {
    emitter.emit("updateState", { showNagModal: true });
}

export default {
    showModal,
    showGcs,
};
