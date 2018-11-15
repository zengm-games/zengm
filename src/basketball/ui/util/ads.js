// @flow

import { emitter } from ".";

function showGcs() {
    window.TriggerPrompt("http://www.basketball-gm.com/", new Date().getTime());
}

function showModal() {
    emitter.emit("updateState", { showNagModal: true });
}

export default {
    showModal,
    showGcs,
};
