// @flow

import type { Local } from "../../common/types";

// These variables are transient and will be reset every refresh. See lock.js for more.

const defaultLocal: Local = {
    autoPlaySeasons: 0,
    phaseText: "",
    statusText: "Idle",
};

const local: Local & { reset: () => void } = {
    autoPlaySeasons: 0,
    phaseText: "",
    statusText: "Idle",
    reset: () => {
        local.autoPlaySeasons = defaultLocal.autoPlaySeasons;
        local.phaseText = defaultLocal.phaseText;
        local.statusText = defaultLocal.statusText;
    },
};

export default local;
